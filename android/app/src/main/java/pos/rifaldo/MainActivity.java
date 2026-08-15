package pos.rifaldo;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBarcodeScannerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
