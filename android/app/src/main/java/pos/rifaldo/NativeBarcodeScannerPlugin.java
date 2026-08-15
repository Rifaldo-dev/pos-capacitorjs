package pos.rifaldo;

import android.Manifest;
import android.app.Dialog;
import android.graphics.Color;
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
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;

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
    private boolean resultDelivered = false;

    @PluginMethod
    public void scan(PluginCall call) {
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

        TextView guide = new TextView(getActivity());
        guide.setText("Arahkan kamera ke QR atau barcode produk\nPemindaian berlangsung offline di perangkat");
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

        Button cancel = new Button(getActivity());
        cancel.setText("Batal");
        cancel.setTextSize(14);
        cancel.setOnClickListener(view -> rejectPending("Scan dibatalkan.", "SCAN_CANCELLED"));
        FrameLayout.LayoutParams cancelParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        cancelParams.bottomMargin = 28;
        cameraFrame.addView(cancel, cancelParams);

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
                cameraProvider.bindToLifecycle(
                    (LifecycleOwner) getActivity(),
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageAnalysis
                );
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
        InputImage inputImage = InputImage.fromMediaImage(
            mediaImage,
            imageProxy.getImageInfo().getRotationDegrees()
        );
        barcodeScanner.process(inputImage)
            .addOnSuccessListener(barcodes -> {
                if (resultDelivered || barcodes == null) return;
                for (Barcode barcode : barcodes) {
                    String rawValue = barcode.getRawValue();
                    if (rawValue != null && !rawValue.trim().isEmpty()) {
                        resolvePending(rawValue.trim(), formatName(barcode.getFormat()));
                        break;
                    }
                }
            })
            .addOnCompleteListener(task -> imageProxy.close());
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
