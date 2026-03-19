/** Big-endian binary reader (DIS network byte order). */

export class BinaryReader {
  private readonly view: DataView;
  private offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  getOffset(): number {
    return this.offset;
  }

  setOffset(pos: number): void {
    if (pos < 0 || pos > this.view.byteLength) {
      throw new RangeError(
        `BinaryReader.setOffset: offset ${pos} out of range [0, ${this.view.byteLength}]`
      );
    }
    this.offset = pos;
  }

  skip(bytes: number): void {
    if (bytes < 0) {
      throw new RangeError(`BinaryReader.skip: negative bytes (${bytes})`);
    }
    this.ensureReadable(bytes);
    this.offset += bytes;
  }

  private ensureReadable(byteCount: number): void {
    if (this.offset + byteCount > this.view.byteLength) {
      throw new RangeError(
        `BinaryReader: read past end (need ${byteCount} bytes at offset ${this.offset}, length ${this.view.byteLength})`
      );
    }
  }

  readUint8(): number {
    this.ensureReadable(1);
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }

  readUint16(): number {
    this.ensureReadable(2);
    const v = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return v;
  }

  readUint32(): number {
    this.ensureReadable(4);
    const v = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return v;
  }

  readUint64(): bigint {
    this.ensureReadable(8);
    const v = this.view.getBigUint64(this.offset, false);
    this.offset += 8;
    return v;
  }

  readInt8(): number {
    this.ensureReadable(1);
    const v = this.view.getInt8(this.offset);
    this.offset += 1;
    return v;
  }

  readInt16(): number {
    this.ensureReadable(2);
    const v = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return v;
  }

  readInt32(): number {
    this.ensureReadable(4);
    const v = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return v;
  }

  readFloat32(): number {
    this.ensureReadable(4);
    const v = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return v;
  }

  readFloat64(): number {
    this.ensureReadable(8);
    const v = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return v;
  }

  /** Read a fixed number of bytes as a new Uint8Array. */
  readBytes(byteCount: number): Uint8Array {
    this.ensureReadable(byteCount);
    const out = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i++) {
      out[i] = this.view.getUint8(this.offset + i);
    }
    this.offset += byteCount;
    return out;
  }
}
