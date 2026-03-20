import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import {
  decodeEntityId,
  encodeEntityId,
  decodeSimulationAddress,
  encodeSimulationAddress,
} from "../core/entityId.js";
import type { SimulationAddress } from "../core/entityId.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";
import type { Vector3Double, Orientation } from "./entityStatePdu.js";

/** Object type (32 bits): domain, objectKind, category, subcategory. */
export interface PointObjectType {
  /** 8-bit enumeration. */
  domain: number;
  /** 8-bit enumeration. */
  objectKind: number;
  /** 8-bit enumeration. */
  category: number;
  /** 8-bit enumeration. */
  subcategory: number;
}

/**
 * Point Object State PDU (704 bits). Tables 192–193.
 * PDU Type = 43, Protocol Family = 9.
 */
export interface PointObjectStatePdu {
  header: PduHeader;
  /** Object ID (same layout as EntityId; entity field holds object number). */
  objectId: EntityId;
  /** Referenced Object ID. */
  referencedObjectId: EntityId;
  updateNumber: number;
  /** 8-bit enumeration. */
  forceId: number;
  /** 8-bit enumeration. */
  modifications: number;
  objectType: PointObjectType;
  objectLocation: Vector3Double;
  objectOrientation: Orientation;
  /** 32-bit record. */
  specificObjectAppearance: number;
  /** 16-bit record. */
  generalObjectAppearance: number;
  /** 16-bit padding. */
  padding: number;
  requesterSimulationId: SimulationAddress;
  receivingSimulationId: SimulationAddress;
  /** 32-bit padding. */
  padding2: number;
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

function decodeOrientation(reader: BinaryReader): Orientation {
  return {
    psi: reader.readFloat32(),
    theta: reader.readFloat32(),
    phi: reader.readFloat32(),
  };
}

function encodeOrientation(writer: BinaryWriter, o: Orientation): void {
  writer.writeFloat32(o.psi);
  writer.writeFloat32(o.theta);
  writer.writeFloat32(o.phi);
}

function decodePointObjectType(reader: BinaryReader): PointObjectType {
  return {
    domain: reader.readUint8(),
    objectKind: reader.readUint8(),
    category: reader.readUint8(),
    subcategory: reader.readUint8(),
  };
}

function encodePointObjectType(
  writer: BinaryWriter,
  t: PointObjectType
): void {
  writer.writeUint8(t.domain);
  writer.writeUint8(t.objectKind);
  writer.writeUint8(t.category);
  writer.writeUint8(t.subcategory);
}

export function decodePointObjectStatePdu(
  reader: BinaryReader
): PointObjectStatePdu {
  const header = decodePduHeader(reader);
  const objectId = decodeEntityId(reader);
  const referencedObjectId = decodeEntityId(reader);
  const updateNumber = reader.readUint16();
  const forceId = reader.readUint8();
  const modifications = reader.readUint8();
  const objectType = decodePointObjectType(reader);
  const objectLocation = decodeVector3Double(reader);
  const objectOrientation = decodeOrientation(reader);
  const specificObjectAppearance = reader.readUint32();
  const generalObjectAppearance = reader.readUint16();
  const padding = reader.readUint16();
  const requesterSimulationId = decodeSimulationAddress(reader);
  const receivingSimulationId = decodeSimulationAddress(reader);
  const padding2 = reader.readUint32();
  return {
    header,
    objectId,
    referencedObjectId,
    updateNumber,
    forceId,
    modifications,
    objectType,
    objectLocation,
    objectOrientation,
    specificObjectAppearance,
    generalObjectAppearance,
    padding,
    requesterSimulationId,
    receivingSimulationId,
    padding2,
  };
}

export function encodePointObjectStatePdu(
  writer: BinaryWriter,
  pdu: PointObjectStatePdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.objectId);
  encodeEntityId(writer, pdu.referencedObjectId);
  writer.writeUint16(pdu.updateNumber);
  writer.writeUint8(pdu.forceId);
  writer.writeUint8(pdu.modifications);
  encodePointObjectType(writer, pdu.objectType);
  encodeVector3Double(writer, pdu.objectLocation);
  encodeOrientation(writer, pdu.objectOrientation);
  writer.writeUint32(pdu.specificObjectAppearance);
  writer.writeUint16(pdu.generalObjectAppearance);
  writer.writeUint16(pdu.padding);
  encodeSimulationAddress(writer, pdu.requesterSimulationId);
  encodeSimulationAddress(writer, pdu.receivingSimulationId);
  writer.writeUint32(pdu.padding2);
  writer.patchUint16(8, writer.getOffset());
}
