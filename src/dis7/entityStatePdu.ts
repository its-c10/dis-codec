import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Entity type (64 bits): kind, domain, country, category, subcategory, specific, extra. */
export interface EntityType {
  kind: number;
  domain: number;
  country: number;
  category: number;
  subcategory: number;
  specific: number;
  extra: number;
}

/** Three-component vector (float32). */
export interface Vector3Float {
  x: number;
  y: number;
  z: number;
}

/** Three-component vector (float64). */
export interface Vector3Double {
  x: number;
  y: number;
  z: number;
}

/** Entity orientation: psi, theta, phi (radians, float32). */
export interface Orientation {
  psi: number;
  theta: number;
  phi: number;
}

/** Dead reckoning parameters (320 bits). */
export interface DeadReckoningParameters {
  /** 8-bit enumeration. */
  deadReckoningAlgorithm: number;
  /** Other parameters, 120 bits (15 bytes). */
  otherParameters: Uint8Array;
  entityLinearAcceleration: Vector3Float;
  entityAngularVelocity: Vector3Float;
}

/** Entity marking: character set plus 11 characters (96 bits). */
export interface EntityMarking {
  /** 8-bit enumeration. */
  characterSet: number;
  /** 11 bytes (88 bits). */
  characters: Uint8Array;
}

/** Variable parameter record (128 bits). */
export interface VariableParameter {
  /** 8-bit enumeration. */
  recordType: number;
  /** Record-specific fields, 120 bits (15 bytes). */
  recordSpecific: Uint8Array;
}

/**
 * Entity State PDU (Table 134).
 * Fixed part 1152 bits (144 bytes), then N variable parameter records of 128 bits (16 bytes) each.
 */
export interface EntityStatePdu {
  header: PduHeader;
  entityId: EntityId;
  /** 8-bit enumeration (e.g. Friendly, Opposing, Neutral). */
  forceId: number;
  numberOfVariableParameterRecords: number;
  entityType: EntityType;
  alternateEntityType: EntityType;
  entityLinearVelocity: Vector3Float;
  entityLocation: Vector3Double;
  entityOrientation: Orientation;
  /** 32-bit record. */
  entityAppearance: number;
  deadReckoningParameters: DeadReckoningParameters;
  entityMarking: EntityMarking;
  /** 32-bit record. */
  capabilities: number;
  variableParameters: VariableParameter[];
}

const DEAD_RECKONING_OTHER_BYTES = 15;
const ENTITY_MARKING_CHARACTERS_BYTES = 11;
const VARIABLE_PARAM_RECORD_SPECIFIC_BYTES = 15;

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

function decodeDeadReckoningParameters(
  reader: BinaryReader
): DeadReckoningParameters {
  return {
    deadReckoningAlgorithm: reader.readUint8(),
    otherParameters: reader.readBytes(DEAD_RECKONING_OTHER_BYTES),
    entityLinearAcceleration: decodeVector3Float(reader),
    entityAngularVelocity: decodeVector3Float(reader),
  };
}

function encodeDeadReckoningParameters(
  writer: BinaryWriter,
  d: DeadReckoningParameters
): void {
  writer.writeUint8(d.deadReckoningAlgorithm);
  writer.writeBytes(d.otherParameters);
  encodeVector3Float(writer, d.entityLinearAcceleration);
  encodeVector3Float(writer, d.entityAngularVelocity);
}

function decodeEntityMarking(reader: BinaryReader): EntityMarking {
  return {
    characterSet: reader.readUint8(),
    characters: reader.readBytes(ENTITY_MARKING_CHARACTERS_BYTES),
  };
}

function encodeEntityMarking(
  writer: BinaryWriter,
  m: EntityMarking
): void {
  writer.writeUint8(m.characterSet);
  writer.writeBytes(m.characters);
}

function decodeVariableParameter(reader: BinaryReader): VariableParameter {
  return {
    recordType: reader.readUint8(),
    recordSpecific: reader.readBytes(VARIABLE_PARAM_RECORD_SPECIFIC_BYTES),
  };
}

function encodeVariableParameter(
  writer: BinaryWriter,
  v: VariableParameter
): void {
  writer.writeUint8(v.recordType);
  writer.writeBytes(v.recordSpecific);
}

export function decodeEntityStatePdu(reader: BinaryReader): EntityStatePdu {
  const header = decodePduHeader(reader);
  const entityId = decodeEntityId(reader);
  const forceId = reader.readUint8();
  const numberOfVariableParameterRecords = reader.readUint8();
  const entityType = decodeEntityType(reader);
  const alternateEntityType = decodeEntityType(reader);
  const entityLinearVelocity = decodeVector3Float(reader);
  const entityLocation = decodeVector3Double(reader);
  const entityOrientation = decodeOrientation(reader);
  const entityAppearance = reader.readUint32();
  const deadReckoningParameters = decodeDeadReckoningParameters(reader);
  const entityMarking = decodeEntityMarking(reader);
  const capabilities = reader.readUint32();
  const variableParameters: VariableParameter[] = [];
  for (let i = 0; i < numberOfVariableParameterRecords; i++) {
    variableParameters.push(decodeVariableParameter(reader));
  }
  return {
    header,
    entityId,
    forceId,
    numberOfVariableParameterRecords,
    entityType,
    alternateEntityType,
    entityLinearVelocity,
    entityLocation,
    entityOrientation,
    entityAppearance,
    deadReckoningParameters,
    entityMarking,
    capabilities,
    variableParameters,
  };
}

export function encodeEntityStatePdu(
  writer: BinaryWriter,
  pdu: EntityStatePdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.entityId);
  writer.writeUint8(pdu.forceId);
  writer.writeUint8(pdu.numberOfVariableParameterRecords);
  encodeEntityType(writer, pdu.entityType);
  encodeEntityType(writer, pdu.alternateEntityType);
  encodeVector3Float(writer, pdu.entityLinearVelocity);
  encodeVector3Double(writer, pdu.entityLocation);
  encodeOrientation(writer, pdu.entityOrientation);
  writer.writeUint32(pdu.entityAppearance);
  encodeDeadReckoningParameters(writer, pdu.deadReckoningParameters);
  encodeEntityMarking(writer, pdu.entityMarking);
  writer.writeUint32(pdu.capabilities);
  for (const vp of pdu.variableParameters) {
    encodeVariableParameter(writer, vp);
  }
  writer.patchUint16(8, writer.getOffset());
}
