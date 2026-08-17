package pos.rifaldo;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int BLUETOOTH_PERMISSION_REQUEST = 4101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBarcodeScannerPlugin.class);
        super.onCreate(savedInstanceState);
        requestBluetoothPermissionsIfNeeded();
    }

    private void requestBluetoothPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            String[] permissions = new String[] {
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_CONNECT
            };
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, permissions, BLUETOOTH_PERMISSION_REQUEST);
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[] { Manifest.permission.ACCESS_FINE_LOCATION }, BLUETOOTH_PERMISSION_REQUEST);
        }
    }
}
