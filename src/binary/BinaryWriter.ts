/** Big-endian binary writer with growable buffer (DIS network byte order). */

export class BinaryWriter {
  private buf: Uint8Array;
  private view: DataView;
  private offset = 0;

  constructor(initialCapacity = 64) {
    this.buf = new Uint8Array(initialCapacity);
    this.view = new DataView(this.buf.buffer, 0, this.buf.byteLength);
  }

  getOffset(): number {
    return this.offset;
  }

  /** Returns a copy of written bytes as ArrayBuffer. */
  toArrayBuffer(): ArrayBuffer {
    const out = new ArrayBuffer(this.offset);
    new Uint8Array(out).set(this.buf.subarray(0, this.offset));
    return out;
  }

  /** Overwrite a uint16 at the given offset (does not advance write position). Used to patch PDU length. */
  patchUint16(offset: number, value: number): void {
    if (offset < 0 || offset + 2 > this.offset) {
      throw new RangeError(
        `BinaryWriter.patchUint16: offset ${offset} out of range [0, ${this.offset - 2}]`
      );
    }
    this.view.setUint16(offset, value, false);
  }

  private ensureWritable(byteCount: number): void {
    const need = this.offset + byteCount;
    if (need <= this.buf.byteLength) return;
    let cap = this.buf.byteLength;
    while (cap < need) cap = Math.max(cap * 2, need);
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.offset));
    this.buf = next;
    this.view = new DataView(this.buf.buffer, 0, this.buf.byteLength);
  }

  writeUint8(value: number): void {
    this.ensureWritable(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  writeUint16(value: number): void {
    this.ensureWritable(2);
    this.view.setUint16(this.offset, value, false);
    this.offset += 2;
  }

  writeUint32(value: number): void {
    this.ensureWritable(4);
    this.view.setUint32(this.offset, value, false);
    this.offset += 4;
  }

  writeUint64(value: bigint): void {
    this.ensureWritable(8);
    this.view.setBigUint64(this.offset, value, false);
    this.offset += 8;
  }

  writeInt8(value: number): void {
    this.ensureWritable(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
  }

  writeInt16(value: number): void {
    this.ensureWritable(2);
    this.view.setInt16(this.offset, value, false);
    this.offset += 2;
  }

  writeInt32(value: number): void {
    this.ensureWritable(4);
    this.view.setInt32(this.offset, value, false);
    this.offset += 4;
  }

  writeFloat32(value: number): void {
    this.ensureWritable(4);
    this.view.setFloat32(this.offset, value, false);
    this.offset += 4;
  }

  writeFloat64(value: number): void {
    this.ensureWritable(8);
    this.view.setFloat64(this.offset, value, false);
    this.offset += 8;
  }

  /** Write raw bytes from a Uint8Array or ArrayBuffer. */
  writeBytes(data: Uint8Array | ArrayBuffer): void {
    const u8 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    this.ensureWritable(u8.byteLength);
    this.buf.set(u8, this.offset);
    this.offset += u8.byteLength;
  }
}
