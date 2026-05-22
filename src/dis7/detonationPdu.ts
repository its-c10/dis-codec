import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import type { EventId } from "../core/eventId.js";
import { decodeEventId, encodeEventId } from "../core/eventId.js";
import {
  decodeWarfareDescriptor,
  encodeWarfareDescriptor,
  type WarfareDescriptor,
  type WarfareDescriptorVariant,
} from "./descriptors.js";
import type { Vector3Double, Vector3Float, VariableParameter } from "./entityStatePdu.js";
import {
  DETONATION_PDU_FIXED_LENGTH,
  ENTITY_STATE_VARIABLE_PARAMETER_RECORD_LENGTH,
} from "./constants.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";
import {
  assertByteArrayLength,
  assertByteArrayValues,
  assertCountMatches,
} from "./validation.js";

export type DetonationDescriptor = WarfareDescriptor;

export type {
  MunitionDescriptor,
  ExpendableDescriptor,
  ExplosionDescriptor,
} from "./descriptors.js";

/**
 * Detonation PDU (832 + 128N bits). Tables 140, 7.3.3.
 * PDU Type = 3, Protocol Family = 2 (Warfare).
 */
export interface DetonationPdu {
  header: PduHeader;
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  explodingEntityId: EntityId;
  eventId: EventId;
  velocity: Vector3Float;
  locationInWorldCoordinates: Vector3Double;
  descriptor: DetonationDescriptor;
  locationInEntityCoordinates: Vector3Float;
  /** 8-bit enumeration */
  detonationResult: number;
  numberOfVariableParameterRecords: number;
  /** 16 bits unused */
  padding: number;
  variableParameters: VariableParameter[];
}

const VARIABLE_PARAM_RECORD_SPECIFIC_BYTES = 15;

function toUint8Array(data: number[]): Uint8Array {
  return Uint8Array.from(data);
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

function decodeVariableParameter(reader: BinaryReader): VariableParameter {
  return {
    recordType: reader.readUint8(),
    recordSpecific: Array.from(
      reader.readBytes(VARIABLE_PARAM_RECORD_SPECIFIC_BYTES)
    ),
  };
}

function encodeVariableParameter(
  writer: BinaryWriter,
  v: VariableParameter
): void {
  writer.writeUint8(v.recordType);
  writer.writeBytes(toUint8Array(v.recordSpecific));
}

export type DecodeDetonationPduOptions = {
  /**
   * Wire layout for the 128-bit descriptor (munition, explosion, or expendable).
   * Defaults to `"munition"`. Not present on the wire—see README.
   */
  descriptorVariant?: WarfareDescriptorVariant;
};

export function decodeDetonationPdu(
  reader: BinaryReader,
  options: DecodeDetonationPduOptions = {}
): DetonationPdu {
  const descriptorVariant = options.descriptorVariant ?? "munition";
  const header = decodePduHeader(reader);
  const sourceEntityId = decodeEntityId(reader);
  const targetEntityId = decodeEntityId(reader);
  const explodingEntityId = decodeEntityId(reader);
  const eventId = decodeEventId(reader);
  const velocity = decodeVector3Float(reader);
  const locationInWorldCoordinates = decodeVector3Double(reader);
  const descriptor = decodeWarfareDescriptor(reader, descriptorVariant);
  const locationInEntityCoordinates = decodeVector3Float(reader);
  const detonationResult = reader.readUint8();
  const numberOfVariableParameterRecords = reader.readUint8();
  const padding = reader.readUint16();
  const variableParameters: VariableParameter[] = [];
  for (let i = 0; i < numberOfVariableParameterRecords; i++) {
    variableParameters.push(decodeVariableParameter(reader));
  }
  return {
    header,
    sourceEntityId,
    targetEntityId,
    explodingEntityId,
    eventId,
    velocity,
    locationInWorldCoordinates,
    descriptor,
    locationInEntityCoordinates,
    detonationResult,
    numberOfVariableParameterRecords,
    padding,
    variableParameters,
  };
}

export function encodeDetonationPdu(
  writer: BinaryWriter,
  pdu: DetonationPdu
): void {
  assertCountMatches(
    "numberOfVariableParameterRecords",
    pdu.numberOfVariableParameterRecords,
    pdu.variableParameters.length
  );
  for (let i = 0; i < pdu.variableParameters.length; i++) {
    assertByteArrayLength(
      `variableParameters[${i}].recordSpecific`,
      pdu.variableParameters[i].recordSpecific,
      VARIABLE_PARAM_RECORD_SPECIFIC_BYTES
    );
    assertByteArrayValues(
      `variableParameters[${i}].recordSpecific`,
      pdu.variableParameters[i].recordSpecific
    );
  }
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.sourceEntityId);
  encodeEntityId(writer, pdu.targetEntityId);
  encodeEntityId(writer, pdu.explodingEntityId);
  encodeEventId(writer, pdu.eventId);
  encodeVector3Float(writer, pdu.velocity);
  encodeVector3Double(writer, pdu.locationInWorldCoordinates);
  encodeWarfareDescriptor(writer, pdu.descriptor);
  encodeVector3Float(writer, pdu.locationInEntityCoordinates);
  writer.writeUint8(pdu.detonationResult);
  writer.writeUint8(pdu.numberOfVariableParameterRecords);
  writer.writeUint16(pdu.padding);
  for (const vp of pdu.variableParameters) {
    encodeVariableParameter(writer, vp);
  }
  writer.patchUint16(8, writer.getOffset());
}

/** Total Detonation PDU size in bytes for N variable parameter records. */
export function detonationPduLength(
  numberOfVariableParameterRecords: number
): number {
  return (
    DETONATION_PDU_FIXED_LENGTH +
    numberOfVariableParameterRecords *
      ENTITY_STATE_VARIABLE_PARAMETER_RECORD_LENGTH
  );
}
