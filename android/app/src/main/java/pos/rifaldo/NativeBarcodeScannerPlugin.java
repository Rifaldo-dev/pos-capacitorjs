package pos.rifaldo;

import android.Manifest;
import android.app.Dialog;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.core.TorchState;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.common.InputImage;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "NativeBarcodeScanner",
    permissions = {
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA })
    }
)
public class NativeBarcodeScannerPlugin extends Plugin {
    private PluginCall pendingCall;
    private Dialog scannerDialog;
    private ProcessCameraProvider cameraProvider;
    private ImageAnalysis imageAnalysis;
    private BarcodeScanner barcodeScanner;
    private ExecutorService analysisExecutor;
    private Camera camera;
    private Button torchButton;
    private Button finishButton;
    private TextView scanStatus;
    private TrackingOverlay trackingOverlay;
    private boolean resultDelivered = false;
    private boolean multiScan = false;
    private final Set<String> scannedCodes = new LinkedHashSet<>();

    @PluginMethod
    public void scan(PluginCall call) {
        multiScan = Boolean.TRUE.equals(call.getBoolean("multiScan", false));
        if (pendingCall != null) {
            call.reject("Scanner sedang digunakan.");
            return;
        }
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermissionCallback");
            return;
        }
        startNativeScanner(call);
    }

    @PermissionCallback
    private void cameraPermissionCallback(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            startNativeScanner(call);
        } else {
            call.reject("Izin kamera diperlukan untuk memindai barcode.", "CAMERA_PERMISSION_DENIED");
        }
    }

    private void startNativeScanner(PluginCall call) {
        pendingCall = call;
        resultDelivered = false;
        scannedCodes.clear();
        analysisExecutor = Executors.newSingleThreadExecutor();
        barcodeScanner = BarcodeScanning.getClient(new BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E,
                Barcode.FORMAT_CODE_128,
                Barcode.FORMAT_CODE_39,
                Barcode.FORMAT_ITF,
                Barcode.FORMAT_QR_CODE
            )
            .build());
        getActivity().runOnUiThread(this::showScannerDialog);
    }

    private void showScannerDialog() {
        if (getActivity() == null || pendingCall == null) {
            rejectPending("Scanner tidak dapat dibuka.", "SCANNER_UNAVAILABLE");
            return;
        }

        PreviewView previewView = new PreviewView(getActivity());
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);

        FrameLayout cameraFrame = new FrameLayout(getActivity());
        cameraFrame.setBackgroundColor(Color.BLACK);
        cameraFrame.addView(previewView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        trackingOverlay = new TrackingOverlay(getActivity());
        cameraFrame.addView(trackingOverlay, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        TextView guide = new TextView(getActivity());
        guide.setText(multiScan ? "Scan banyak produk\nArahkan kamera ke barcode satu per satu" : "Arahkan kamera ke QR atau barcode produk");
        guide.setTextColor(Color.WHITE);
        guide.setTextSize(14);
        guide.setGravity(Gravity.CENTER);
        guide.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        guide.setPadding(20, 18, 20, 18);
        guide.setBackgroundColor(0x88000000);
        FrameLayout.LayoutParams guideParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP
        );
        cameraFrame.addView(guide, guideParams);

        scanStatus = new TextView(getActivity());
        scanStatus.setText(multiScan ? "0 produk terbaca" : "Memindai...");
        scanStatus.setTextColor(Color.WHITE);
        scanStatus.setTextSize(14);
        scanStatus.setGravity(Gravity.CENTER);
        scanStatus.setPadding(18, 10, 18, 10);
        scanStatus.setBackgroundColor(0xAA1B5E20);
        FrameLayout.LayoutParams statusParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.CENTER_HORIZONTAL
        );
        statusParams.topMargin = 92;
        cameraFrame.addView(scanStatus, statusParams);

        Button cancel = new Button(getActivity());
        cancel.setText("Batal");
        cancel.setTextSize(14);
        cancel.setOnClickListener(view -> rejectPending("Scan dibatalkan.", "SCAN_CANCELLED"));
        FrameLayout.LayoutParams cancelParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM | (multiScan ? Gravity.START : Gravity.CENTER_HORIZONTAL)
        );
        cancelParams.bottomMargin = 28;
        if (multiScan) cancelParams.leftMargin = 20;
        cameraFrame.addView(cancel, cancelParams);

        torchButton = new Button(getActivity());
        torchButton.setText("Senter: Mati");
        torchButton.setTextSize(12);
        torchButton.setOnClickListener(view -> toggleTorch());
        FrameLayout.LayoutParams torchParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM | Gravity.END
        );
        torchParams.bottomMargin = 28;
        torchParams.rightMargin = 20;
        cameraFrame.addView(torchButton, torchParams);

        if (multiScan) {
            finishButton = new Button(getActivity());
            finishButton.setText("Selesai (0)");
            finishButton.setTextSize(14);
            finishButton.setEnabled(false);
            finishButton.setOnClickListener(view -> resolveMultiScan());
            FrameLayout.LayoutParams finishParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );
            finishParams.bottomMargin = 28;
            cameraFrame.addView(finishButton, finishParams);
        }

        scannerDialog = new Dialog(getActivity());
        scannerDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        scannerDialog.setContentView(cameraFrame);
        scannerDialog.setCancelable(false);
        Window window = scannerDialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawableResource(android.R.color.black);
            window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
            window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }
        scannerDialog.setOnDismissListener(dialog -> {
            if (!resultDelivered && pendingCall != null) {
                rejectPending("Scan dibatalkan.", "SCAN_CANCELLED");
            }
        });
        scannerDialog.show();
        if (window != null) {
            window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
        }
        bindCamera(previewView);
    }

    private void bindCamera(PreviewView previewView) {
        ListenableFuture<ProcessCameraProvider> providerFuture = ProcessCameraProvider.getInstance(getActivity());
        providerFuture.addListener(() -> {
            try {
                cameraProvider = providerFuture.get();
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                imageAnalysis = new ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setTargetResolution(new android.util.Size(1280, 720))
                    .build();
                imageAnalysis.setAnalyzer(analysisExecutor, this::analyzeFrame);

                cameraProvider.unbindAll();
                camera = cameraProvider.bindToLifecycle(
                    (LifecycleOwner) getActivity(),
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageAnalysis
                );
                if (torchButton != null && !camera.getCameraInfo().hasFlashUnit()) {
                    torchButton.setEnabled(false);
                    torchButton.setText("Senter tidak tersedia");
                }
            } catch (ExecutionException | InterruptedException | RuntimeException error) {
                rejectPending("Kamera native tidak dapat dimulai: " + error.getMessage(), "CAMERA_START_FAILED");
            }
        }, ContextCompat.getMainExecutor(getActivity()));
    }

    private void analyzeFrame(@NonNull ImageProxy imageProxy) {
        if (resultDelivered || barcodeScanner == null) {
            imageProxy.close();
            return;
        }
        android.media.Image mediaImage = imageProxy.getImage();
        if (mediaImage == null) {
            imageProxy.close();
            return;
        }
        final int imageWidth = imageProxy.getWidth();
        final int imageHeight = imageProxy.getHeight();
        final int rotation = imageProxy.getImageInfo().getRotationDegrees();
        InputImage inputImage = InputImage.fromMediaImage(mediaImage, rotation);
        barcodeScanner.process(inputImage)
            .addOnSuccessListener(barcodes -> {
                if (resultDelivered || barcodes == null) return;
                List<TrackedBarcode> detections = new ArrayList<>();
                for (Barcode barcode : barcodes) {
                    String rawValue = barcode.getRawValue();
                    Rect bounds = barcode.getBoundingBox();
                    if (rawValue == null || rawValue.trim().isEmpty() || bounds == null) continue;
                    String content = rawValue.trim();
                    detections.add(new TrackedBarcode(new Rect(bounds), content, formatName(barcode.getFormat())));
                    if (!multiScan) {
                        resolvePending(content, formatName(barcode.getFormat()));
                        break;
                    }
                    if (scannedCodes.add(content)) {
                        String status = scannedCodes.size() + " produk terbaca";
                        getActivity().runOnUiThread(() -> {
                            if (scanStatus != null) scanStatus.setText(status);
                            if (finishButton != null) {
                                finishButton.setEnabled(true);
                                finishButton.setText("Selesai (" + scannedCodes.size() + ")");
                            }
                        });
                    }
                }
                getActivity().runOnUiThread(() -> {
                    if (trackingOverlay != null) trackingOverlay.setDetections(detections, imageWidth, imageHeight, rotation);
                });
            })
            .addOnFailureListener(error -> getActivity().runOnUiThread(() -> {
                if (trackingOverlay != null) trackingOverlay.setDetections(Collections.emptyList(), imageWidth, imageHeight, rotation);
            }))
            .addOnCompleteListener(task -> imageProxy.close());
    }

    private static final class TrackedBarcode {
        final Rect bounds;
        final String content;
        final String format;

        TrackedBarcode(Rect bounds, String content, String format) {
            this.bounds = bounds;
            this.content = content;
            this.format = format;
        }
    }

    private static final class TrackingOverlay extends View {
        private final Paint boxPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint labelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private List<TrackedBarcode> detections = Collections.emptyList();
        private int imageWidth;
        private int imageHeight;
        private int rotation;

        TrackingOverlay(android.content.Context context) {
            super(context);
            setWillNotDraw(false);
            boxPaint.setStyle(Paint.Style.STROKE);
            boxPaint.setStrokeWidth(5f);
            boxPaint.setColor(Color.rgb(0, 230, 118));
            labelPaint.setStyle(Paint.Style.FILL);
            labelPaint.setColor(0xCC0B2E20);
            labelTextPaint.setStyle(Paint.Style.FILL);
            labelTextPaint.setColor(Color.WHITE);
            labelTextPaint.setTextSize(30f);
            labelTextPaint.setTypeface(Typeface.DEFAULT_BOLD);
        }

        void setDetections(List<TrackedBarcode> detections, int imageWidth, int imageHeight, int rotation) {
            this.detections = detections == null ? Collections.emptyList() : new ArrayList<>(detections);
            this.imageWidth = imageWidth;
            this.imageHeight = imageHeight;
            this.rotation = rotation;
            postInvalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            if (detections.isEmpty() || imageWidth <= 0 || imageHeight <= 0 || getWidth() <= 0 || getHeight() <= 0) return;
            int sourceWidth = rotation % 180 == 0 ? imageWidth : imageHeight;
            int sourceHeight = rotation % 180 == 0 ? imageHeight : imageWidth;
            float scale = Math.max((float) getWidth() / sourceWidth, (float) getHeight() / sourceHeight);
            float offsetX = (getWidth() - sourceWidth * scale) / 2f;
            float offsetY = (getHeight() - sourceHeight * scale) / 2f;
            for (TrackedBarcode detection : detections) {
                Rect bounds = detection.bounds;
                RectF mapped = new RectF(
                    bounds.left * scale + offsetX,
                    bounds.top * scale + offsetY,
                    bounds.right * scale + offsetX,
                    bounds.bottom * scale + offsetY
                );
                canvas.drawRoundRect(mapped, 18f, 18f, boxPaint);
                String label = detection.format + "  " + detection.content;
                if (label.length() > 28) label = label.substring(0, 25) + "...";
                float labelWidth = labelTextPaint.measureText(label) + 28f;
                float labelTop = Math.max(8f, mapped.top - 48f);
                canvas.drawRoundRect(mapped.left, labelTop, Math.min(getWidth() - 8f, mapped.left + labelWidth), labelTop + 42f, 12f, 12f, labelPaint);
                canvas.drawText(label, mapped.left + 14f, labelTop + 30f, labelTextPaint);
            }
        }
    }

    private String formatName(int format) {
        switch (format) {
            case Barcode.FORMAT_EAN_13: return "EAN-13";
            case Barcode.FORMAT_EAN_8: return "EAN-8";
            case Barcode.FORMAT_UPC_A: return "UPC-A";
            case Barcode.FORMAT_UPC_E: return "UPC-E";
            case Barcode.FORMAT_CODE_128: return "Code 128";
            case Barcode.FORMAT_CODE_39: return "Code 39";
            case Barcode.FORMAT_ITF: return "ITF";
            case Barcode.FORMAT_QR_CODE: return "QR Code";
            default: return "Barcode";
        }
    }

    private void toggleTorch() {
        if (camera == null || !camera.getCameraInfo().hasFlashUnit()) return;
        Integer state = camera.getCameraInfo().getTorchState().getValue();
        boolean enabled = state != null && state == TorchState.ON;
        camera.getCameraControl().enableTorch(!enabled);
        if (torchButton != null) torchButton.setText(!enabled ? "Senter: Nyala" : "Senter: Mati");
    }

    private void resolveMultiScan() {
        if (resultDelivered || pendingCall == null || scannedCodes.isEmpty()) return;
        resultDelivered = true;
        PluginCall call = pendingCall;
        pendingCall = null;
        JSArray contents = new JSArray();
        for (String code : scannedCodes) contents.put(code);
        closeScannerResources();
        JSObject result = new JSObject();
        result.put("content", scannedCodes.iterator().next());
        result.put("contents", contents);
        result.put("count", scannedCodes.size());
        result.put("format", "Barcode / QR");
        result.put("cancelled", false);
        call.resolve(result);
    }

    private void resolvePending(String content, String format) {
        if (resultDelivered || pendingCall == null) return;
        resultDelivered = true;
        PluginCall call = pendingCall;
        pendingCall = null;
        closeScannerResources();
        JSObject result = new JSObject();
        result.put("content", content);
        result.put("format", format);
        result.put("cancelled", false);
        call.resolve(result);
    }

    private void rejectPending(String message, String code) {
        if (pendingCall == null) return;
        resultDelivered = true;
        PluginCall call = pendingCall;
        pendingCall = null;
        closeScannerResources();
        call.reject(message, code);
    }

    private void closeScannerResources() {
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
            cameraProvider = null;
        }
        camera = null;
        if (imageAnalysis != null) {
            imageAnalysis.clearAnalyzer();
            imageAnalysis = null;
        }
        if (barcodeScanner != null) {
            barcodeScanner.close();
            barcodeScanner = null;
        }
        if (analysisExecutor != null) {
            analysisExecutor.shutdownNow();
            analysisExecutor = null;
        }
        torchButton = null;
        finishButton = null;
        scanStatus = null;
        trackingOverlay = null;
        if (scannerDialog != null) {
            Dialog dialog = scannerDialog;
            scannerDialog = null;
            getActivity().runOnUiThread(() -> {
                if (dialog.isShowing()) dialog.dismiss();
            });
        }
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (pendingCall != null && !resultDelivered) {
            rejectPending("Scan dibatalkan karena aplikasi tidak aktif.", "SCAN_INTERRUPTED");
        }
    }

    @Override
    protected void handleOnDestroy() {
        closeScannerResources();
        super.handleOnDestroy();
    }
}
