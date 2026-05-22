import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import type { EventId } from "../core/eventId.js";
import { decodeEventId, encodeEventId } from "../core/eventId.js";
import type { Vector3Double, Vector3Float } from "./entityStatePdu.js";
import {
  decodeFireDescriptor,
  encodeFireDescriptor,
  type ExpendableDescriptor,
  type FireDescriptor,
  type MunitionDescriptor,
  EXPENDABLE_DESCRIPTOR_PADDING_BYTES,
} from "./descriptors.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

export type {
  MunitionDescriptor,
  ExpendableDescriptor,
  FireDescriptor,
} from "./descriptors.js";
export { EXPENDABLE_DESCRIPTOR_PADDING_BYTES } from "./descriptors.js";

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
