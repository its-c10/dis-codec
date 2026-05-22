import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import type { EventId } from "../core/eventId.js";
import { decodeEventId, encodeEventId } from "../core/eventId.js";
import type { EntityType, Vector3Double, Vector3Float } from "./entityStatePdu.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Munition descriptor (128 bits). IEEE 6.2.19.2. */
export interface MunitionDescriptor {
  munitionType: EntityType;
  /** 16-bit enumeration */
  warhead: number;
  /** 16-bit enumeration */
  fuse: number;
  quantity: number;
  rate: number;
}

/** Expendable descriptor (128 bits). IEEE 6.2.19.4. */
export interface ExpendableDescriptor {
  expendableType: EntityType;
  /** 16-bit enumeration */
  expendable: number;
  /** 16 bits unused */
  padding: number;
  /** 32 bits unused */
  padding2: number;
}

export type FireDescriptor =
  | { variant: "munition"; munition: MunitionDescriptor }
  | { variant: "expendable"; expendable: ExpendableDescriptor };

/**
 * Fire PDU (768 bits). Tables 139, 7.3.2.
 * PDU Type = 2, Protocol Family = 2 (Warfare).
 */
export interface FirePdu {
  header: PduHeader;
  firingEntityId: EntityId;
  targetEntityId: EntityId;
  munitionExpendableEntityId: EntityId;
  eventId: EventId;
  fireMissionIndex: number;
  locationInWorldCoordinates: Vector3Double;
  descriptor: FireDescriptor;
  velocity: Vector3Float;
  /** Range in meters (32-bit float). Zero if unknown. */
  range: number;
}

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

function decodeVector3Double(reader: BinaryReader): Vector3Double {
  return {
    x: reader.readFloat64(),
    y: reader.readFloat64(),
    z: reader.readFloat64(),
  };
}

function encodeVector3Double(writer: BinaryWriter, v: Vector3Double): void {
  writer.writeFloat64(v.x);
  writer.writeFloat64(v.y);
  writer.writeFloat64(v.z);
}

function decodeVector3Float(reader: BinaryReader): Vector3Float {
  return {
    x: reader.readFloat32(),
    y: reader.readFloat32(),
    z: reader.readFloat32(),
  };
}

function encodeVector3Float(writer: BinaryWriter, v: Vector3Float): void {
  writer.writeFloat32(v.x);
  writer.writeFloat32(v.y);
  writer.writeFloat32(v.z);
}

function decodeMunitionDescriptor(reader: BinaryReader): MunitionDescriptor {
  return {
    munitionType: decodeEntityType(reader),
    warhead: reader.readUint16(),
    fuse: reader.readUint16(),
    quantity: reader.readUint16(),
    rate: reader.readUint16(),
  };
}

function encodeMunitionDescriptor(
  writer: BinaryWriter,
  d: MunitionDescriptor
): void {
  encodeEntityType(writer, d.munitionType);
  writer.writeUint16(d.warhead);
  writer.writeUint16(d.fuse);
  writer.writeUint16(d.quantity);
  writer.writeUint16(d.rate);
}

function decodeExpendableDescriptor(reader: BinaryReader): ExpendableDescriptor {
  return {
    expendableType: decodeEntityType(reader),
    expendable: reader.readUint16(),
    padding: reader.readUint16(),
    padding2: reader.readUint32(),
  };
}

function encodeExpendableDescriptor(
  writer: BinaryWriter,
  d: ExpendableDescriptor
): void {
  encodeEntityType(writer, d.expendableType);
  writer.writeUint16(d.expendable);
  writer.writeUint16(d.padding);
  writer.writeUint32(d.padding2);
}

function decodeFireDescriptor(
  reader: BinaryReader,
  variant: FireDescriptor["variant"]
): FireDescriptor {
  if (variant === "expendable") {
    return { variant: "expendable", expendable: decodeExpendableDescriptor(reader) };
  }
  return { variant: "munition", munition: decodeMunitionDescriptor(reader) };
}

function encodeFireDescriptor(writer: BinaryWriter, d: FireDescriptor): void {
  if (d.variant === "munition") {
    encodeMunitionDescriptor(writer, d.munition);
  } else {
    encodeExpendableDescriptor(writer, d.expendable);
  }
}

export type DecodeFirePduOptions = {
  /** Wire layout matches munition or expendable descriptor (IEEE 6.2.19.2 / 6.2.19.4). */
  descriptorVariant?: FireDescriptor["variant"];
};

export function decodeFirePdu(
  reader: BinaryReader,
  options: DecodeFirePduOptions = {}
): FirePdu {
  const descriptorVariant = options.descriptorVariant ?? "munition";
  return {
    header: decodePduHeader(reader),
    firingEntityId: decodeEntityId(reader),
    targetEntityId: decodeEntityId(reader),
    munitionExpendableEntityId: decodeEntityId(reader),
    eventId: decodeEventId(reader),
    fireMissionIndex: reader.readUint32(),
    locationInWorldCoordinates: decodeVector3Double(reader),
    descriptor: decodeFireDescriptor(reader, descriptorVariant),
    velocity: decodeVector3Float(reader),
    range: reader.readFloat32(),
  };
}

export function encodeFirePdu(writer: BinaryWriter, pdu: FirePdu): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.firingEntityId);
  encodeEntityId(writer, pdu.targetEntityId);
  encodeEntityId(writer, pdu.munitionExpendableEntityId);
  encodeEventId(writer, pdu.eventId);
  writer.writeUint32(pdu.fireMissionIndex);
  encodeVector3Double(writer, pdu.locationInWorldCoordinates);
  encodeFireDescriptor(writer, pdu.descriptor);
  encodeVector3Float(writer, pdu.velocity);
  writer.writeFloat32(pdu.range);
  writer.patchUint16(8, writer.getOffset());
}
