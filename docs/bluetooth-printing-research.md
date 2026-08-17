# Bluetooth Thermal Printing Research Notes

## Selected transport

The project uses `cordova-plugin-bluetooth-serial` version 0.4.7 through Capacitor's Cordova compatibility layer. This plugin exposes classic Bluetooth serial operations needed by common ESC/POS thermal printers, including listing paired devices, connecting to a device address, disconnecting, and writing text or byte data.

The initial package name `capacitor-bluetooth-print` was not present in the npm registry and was rejected. BLE plugins are not the best default for common thermal printers because many receipt printers expose a classic Bluetooth SPP serial service rather than BLE.

## Android permissions

Android 12 and later use runtime permissions `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`. Android 11 and earlier use classic Bluetooth permissions and may require location permission while discovering devices. The manifest therefore includes the version-scoped classic permissions, Android 12+ scan/connect permissions, and location permissions for compatibility.

## Sources

1. Malik12tree, `capacitor-thermal-printer`, https://github.com/Malik12tree/capacitor-thermal-printer
2. Cordova Bluetooth Serial plugin, https://github.com/don/BluetoothSerial
3. Capacitor Community Bluetooth LE, https://github.com/capacitor-community/bluetooth-le
4. Android Bluetooth permissions, https://developer.android.com/develop/connectivity/bluetooth/bt-permissions
5. Capacitor Cordova plugin compatibility, https://capacitorjs.com/docs/plugins/cordova

## Implementation constraint

The sandbox cannot physically test pairing, connection, or paper output from a real thermal printer. The implementation should expose connection errors clearly and preserve the existing browser print fallback when native Bluetooth is unavailable.
