import { Capacitor } from '@capacitor/core'

export type BluetoothDevice = { address: string; name?: string; id?: string }
type Callback = (value?: unknown) => void

type BluetoothSerialPlugin = {
  isEnabled: (success: Callback, failure: Callback) => void
  enable: (success: Callback, failure: Callback) => void
  list: (success: (devices: BluetoothDevice[]) => void, failure: Callback) => void
  connect: (address: string, success: Callback, failure: Callback) => void
  connectInsecure?: (address: string, success: Callback, failure: Callback) => void
  disconnect: (success: Callback, failure: Callback) => void
  isConnected: (success: Callback, failure: Callback) => void
  write: (data: Uint8Array | number[] | ArrayBuffer, success: Callback, failure: Callback) => void
}

declare global {
  interface Window {
    bluetoothSerial?: BluetoothSerialPlugin
    cordova?: { plugins?: { bluetoothSerial?: BluetoothSerialPlugin } }
  }
}

const plugin = (): BluetoothSerialPlugin | null => {
  if (typeof window === 'undefined') return null
  return window.bluetoothSerial ?? window.cordova?.plugins?.bluetoothSerial ?? null
}

const nativeOnly = () => Capacitor.isNativePlatform() && Boolean(plugin())
const errorText = (error: unknown) => error instanceof Error ? error.message : typeof error === 'string' ? error : 'Bluetooth printer tidak tersedia.'

const call = <T>(action: (success: (value: T) => void, failure: (error: unknown) => void) => void) => new Promise<T>((resolve, reject) => action(resolve, reject))

export const bluetoothPrinterAvailable = () => nativeOnly()

export async function isBluetoothEnabled(): Promise<boolean> {
  const device = plugin()
  if (!device) return false
  return Boolean(await call<boolean>((resolve, reject) => device.isEnabled((value) => resolve(Boolean(value)), reject)))
}

export async function enableBluetooth(): Promise<void> {
  const device = plugin()
  if (!device) throw new Error('Fitur Bluetooth hanya tersedia pada aplikasi Android.')
  await call<void>((resolve, reject) => device.enable(() => resolve(), reject))
}

export async function listPairedPrinters(): Promise<BluetoothDevice[]> {
  const device = plugin()
  if (!device) throw new Error('Bluetooth printer hanya tersedia pada aplikasi Android.')
  const devices = await call<BluetoothDevice[]>((resolve, reject) => device.list(resolve, reject))
  return (devices ?? []).filter((item) => item?.address)
}

export async function connectBluetoothPrinter(address: string): Promise<void> {
  const device = plugin()
  if (!device) throw new Error('Bluetooth printer hanya tersedia pada aplikasi Android.')
  const connect = device.connectInsecure ?? device.connect
  await call<void>((resolve, reject) => connect(address, () => resolve(), reject))
}

export async function disconnectBluetoothPrinter(): Promise<void> {
  const device = plugin()
  if (!device) return
  await call<void>((resolve, reject) => device.disconnect(() => resolve(), reject))
}

export async function isBluetoothPrinterConnected(): Promise<boolean> {
  const device = plugin()
  if (!device) return false
  return Boolean(await call<boolean>((resolve, reject) => device.isConnected((value) => resolve(Boolean(value)), reject)))
}

export async function writeBluetoothPrinter(data: Uint8Array): Promise<void> {
  const device = plugin()
  if (!device) throw new Error('Hubungkan printer Bluetooth dari Pengaturan terlebih dahulu.')
  await call<void>((resolve, reject) => device.write(data, () => resolve(), reject))
}

export async function withBluetoothPrinter<T>(action: () => Promise<T>): Promise<T> {
  try { return await action() } catch (error) { throw new Error(errorText(error)) }
}
