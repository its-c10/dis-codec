import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityType } from "./entityStatePdu.js";
import {
  assertByteArrayLength,
  assertByteArrayValues,
} from "./validation.js";

/** Munition descriptor (128 bits). Table 41 / IEEE 6.2.19.2. */
export interface MunitionDescriptor {
  munitionType: EntityType;
  /** 16-bit enumeration */
  warhead: number;
  /** 16-bit enumeration */
  fuse: number;
  quantity: number;
  /** Must be zero when quantity is 1. */
  rate: number;
}

/** Explosion descriptor (128 bits). Table 42 / IEEE 6.2.19.3. */
export interface ExplosionDescriptor {
  explodingObjectType: EntityType;
  /** 16-bit enumeration */
  explosiveMaterial: number;
  /** 16 bits unused */
  padding: number;
  /** Equivalent kilograms of TNT (32-bit float). */
  explosiveForce: number;
}

/** Expendable descriptor (128 bits). Table 43 / IEEE 6.2.19.4. */
export interface ExpendableDescriptor {
  expendableType: EntityType;
  /** 64 bits unused (8 bytes). */
  padding: number[];
}

/** Size of expendable descriptor padding on wire (bytes). */
export const EXPENDABLE_DESCRIPTOR_PADDING_BYTES = 8;

export type WarfareDescriptorVariant = "munition" | "expendable" | "explosion";

export type WarfareDescriptor =
  | { variant: "munition"; munition: MunitionDescriptor }
  | { variant: "expendable"; expendable: ExpendableDescriptor }
  | { variant: "explosion"; explosion: ExplosionDescriptor };

export type FireDescriptor =
  | { variant: "munition"; munition: MunitionDescriptor }
  | { variant: "expendable"; expendable: ExpendableDescriptor };

function decodeEntityType(reader: BinaryReader): EntityType {
  return {
    kind: reader.readUint8(),
    domain: reader.readUint8(),
    country: reader.readUint16(),
    category: reader.readUint8(),
    subcategory: reader.readUint8(),
    specific: reader.readUint8(),
    extra: reader.readUint8(),
  };
}

function encodeEntityType(writer: BinaryWriter, e: EntityType): void {
  writer.writeUint8(e.kind);
  writer.writeUint8(e.domain);
  writer.writeUint16(e.country);
  writer.writeUint8(e.category);
  writer.writeUint8(e.subcategory);
  writer.writeUint8(e.specific);
  writer.writeUint8(e.extra);
}

function toUint8Array(data: number[]): Uint8Array {
  return Uint8Array.from(data);
}

export function decodeMunitionDescriptor(reader: BinaryReader): MunitionDescriptor {
  return {
    munitionType: decodeEntityType(reader),
    warhead: reader.readUint16(),
    fuse: reader.readUint16(),
    quantity: reader.readUint16(),
    rate: reader.readUint16(),
  };
}

export function encodeMunitionDescriptor(
  writer: BinaryWriter,
  d: MunitionDescriptor
): void {
  encodeEntityType(writer, d.munitionType);
  writer.writeUint16(d.warhead);
  writer.writeUint16(d.fuse);
  writer.writeUint16(d.quantity);
  writer.writeUint16(d.rate);
}

export function decodeExplosionDescriptor(reader: BinaryReader): ExplosionDescriptor {
  return {
    explodingObjectType: decodeEntityType(reader),
    explosiveMaterial: reader.readUint16(),
    padding: reader.readUint16(),
    explosiveForce: reader.readFloat32(),
  };
}

export function encodeExplosionDescriptor(
  writer: BinaryWriter,
  d: ExplosionDescriptor
): void {
  encodeEntityType(writer, d.explodingObjectType);
  writer.writeUint16(d.explosiveMaterial);
  writer.writeUint16(d.padding);
  writer.writeFloat32(d.explosiveForce);
}

export function decodeExpendableDescriptor(
  reader: BinaryReader
): ExpendableDescriptor {
  return {
    expendableType: decodeEntityType(reader),
    padding: Array.from(
      reader.readBytes(EXPENDABLE_DESCRIPTOR_PADDING_BYTES)
    ),
  };
}

export function encodeExpendableDescriptor(
  writer: BinaryWriter,
  d: ExpendableDescriptor
): void {
  assertByteArrayLength(
    "expendable.padding",
    d.padding,
    EXPENDABLE_DESCRIPTOR_PADDING_BYTES
  );
  assertByteArrayValues("expendable.padding", d.padding);
  encodeEntityType(writer, d.expendableType);
  writer.writeBytes(toUint8Array(d.padding));
}

export function decodeWarfareDescriptor(
  reader: BinaryReader,
  variant: WarfareDescriptorVariant
): WarfareDescriptor {
  switch (variant) {
    case "expendable":
      return { variant: "expendable", expendable: decodeExpendableDescriptor(reader) };
    case "explosion":
      return { variant: "explosion", explosion: decodeExplosionDescriptor(reader) };
    default:
      return { variant: "munition", munition: decodeMunitionDescriptor(reader) };
  }
}

export function encodeWarfareDescriptor(
  writer: BinaryWriter,
  d: WarfareDescriptor
): void {
  switch (d.variant) {
    case "expendable":
      encodeExpendableDescriptor(writer, d.expendable);
      break;
    case "explosion":
      encodeExplosionDescriptor(writer, d.explosion);
      break;
    default:
      encodeMunitionDescriptor(writer, d.munition);
  }
}

export function encodeFireDescriptor(
  writer: BinaryWriter,
  d: FireDescriptor
): void {
  encodeWarfareDescriptor(writer, d);
}

export function decodeFireDescriptor(
  reader: BinaryReader,
  variant: FireDescriptor["variant"]
): FireDescriptor {
  const decoded = decodeWarfareDescriptor(reader, variant);
  if (decoded.variant === "explosion") {
    throw new RangeError("Fire PDU descriptor cannot be explosion");
  }
  return decoded;
}
