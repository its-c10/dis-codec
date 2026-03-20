import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Antenna location (X, Y, Z float64). */
export interface Vector3Double {
  x: number;
  y: number;
  z: number;
}

/** Relative antenna location (x, y, z float32). */
export interface Vector3Float {
  x: number;
  y: number;
  z: number;
}

/** Radio Type record (64 bits). Table 103. */
export interface RadioType {
  /** 8-bit enumeration. */
  entityKind: number;
  /** 8-bit enumeration. */
  domain: number;
  /** 16-bit enumeration. */
  country: number;
  /** 8-bit enumeration. */
  category: number;
  /** 8-bit enumeration. */
  subcategory: number;
  /** 8-bit enumeration. */
  specific: number;
  /** 8-bit enumeration. */
  extra: number;
}

/** Modulation type (64-bit record: 4 × 16-bit). */
export interface ModulationType {
  spreadSpectrum: number;
  majorModulation: number;
  detail: number;
  radioSystem: number;
}

/** Antenna pattern length in octets for Beam Antenna Pattern. */
export const BEAM_ANTENNA_PATTERN_LENGTH = 40;
/**
 * Beam Antenna Pattern record (320 bits). Table 31.
 */
export interface BeamAntennaPattern {
  /** Beam direction: psi, theta, phi (radians, float32). */
  beamDirection: { psi: number; theta: number; phi: number };
  azimuthBeamwidth: number;
  elevationBeamwidth: number;
  /** 8-bit enumeration. */
  referenceSystem: number;
  eZ: number;
  eX: number;
  phase: number;
}

/** Variable Transmitter Parameters record (variable length). */
export interface VariableTransmitterParameter {
  /** 32-bit enumeration. */
  recordType: number;
  /** Record length in octets (6 + data.length). Set automatically during encode. */
  recordLength?: number;
  /** Record-specific fields + padding (recordLength - 6 octets). */
  data: Uint8Array;
}

/**
 * Transmitter PDU (Table 176).
 * Fixed part 832 bits (104 bytes), then M octets modulation parameters, A octets antenna pattern, then N variable transmitter parameter records.
 */
export interface TransmitterPdu {
  header: PduHeader;
  /** Radio Reference ID (same layout as EntityId). */
  radioReferenceId: EntityId;
  radioNumber: number;
  /** Radio Type record (Table 103). */
  radioType: RadioType;
  /** 8-bit enumeration. */
  transmitState: number;
  /** 8-bit enumeration. */
  inputSource: number;
  numberOfVariableTransmitterParameterRecords: number;
  antennaLocation: Vector3Double;
  relativeAntennaLocation: Vector3Float;
  /** 16-bit enumeration. */
  antennaPatternType: number;
  /** Antenna pattern length in octets (A). */
  antennaPatternLength: number;
  /** 64-bit unsigned integer (e.g. frequency in Hz). */
  frequency: bigint;
  transmitFrequencyBandwidth: number;
  power: number;
  modulationType: ModulationType;
  /** 16-bit enumeration. */
  cryptoSystem: number;
  /** 16-bit record. */
  cryptoKeyId: number;
  /** Length of modulation parameters in octets (M). Set automatically during encode. */
  lengthOfModulationParameters?: number;
  /** Modulation parameters (M octets). */
  modulationParameters: Uint8Array;
  /** Antenna pattern (e.g. Beam Antenna Pattern, Table 31). */
  antennaPattern: BeamAntennaPattern;
  variableTransmitterParameters: VariableTransmitterParameter[];
}

function decodeRadioType(reader: BinaryReader): RadioType {
  return {
    entityKind: reader.readUint8(),
    domain: reader.readUint8(),
    country: reader.readUint16(),
    category: reader.readUint8(),
    subcategory: reader.readUint8(),
    specific: reader.readUint8(),
    extra: reader.readUint8(),
  };
}

function encodeRadioType(writer: BinaryWriter, r: RadioType): void {
  writer.writeUint8(r.entityKind);
  writer.writeUint8(r.domain);
  writer.writeUint16(r.country);
  writer.writeUint8(r.category);
  writer.writeUint8(r.subcategory);
  writer.writeUint8(r.specific);
  writer.writeUint8(r.extra);
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

function decodeModulationType(reader: BinaryReader): ModulationType {
  return {
    spreadSpectrum: reader.readUint16(),
    majorModulation: reader.readUint16(),
    detail: reader.readUint16(),
    radioSystem: reader.readUint16(),
  };
}

function encodeModulationType(
  writer: BinaryWriter,
  m: ModulationType
): void {
  writer.writeUint16(m.spreadSpectrum);
  writer.writeUint16(m.majorModulation);
  writer.writeUint16(m.detail);
  writer.writeUint16(m.radioSystem);
}

function decodeBeamAntennaPattern(reader: BinaryReader): BeamAntennaPattern {
  const beamDirection = {
    psi: reader.readFloat32(),
    theta: reader.readFloat32(),
    phi: reader.readFloat32(),
  };
  const azimuthBeamwidth = reader.readFloat32();
  const elevationBeamwidth = reader.readFloat32();
  const referenceSystem = reader.readUint8();
  reader.readUint8(); // padding 8
  reader.readUint16(); // padding 16
  const eZ = reader.readFloat32();
  const eX = reader.readFloat32();
  const phase = reader.readFloat32();
  reader.readUint32(); // padding 32
  return {
    beamDirection,
    azimuthBeamwidth,
    elevationBeamwidth,
    referenceSystem,
    eZ,
    eX,
    phase,
  };
}

function encodeBeamAntennaPattern(
  writer: BinaryWriter,
  a: BeamAntennaPattern
): void {
  writer.writeFloat32(a.beamDirection.psi);
  writer.writeFloat32(a.beamDirection.theta);
  writer.writeFloat32(a.beamDirection.phi);
  writer.writeFloat32(a.azimuthBeamwidth);
  writer.writeFloat32(a.elevationBeamwidth);
  writer.writeUint8(a.referenceSystem);
  writer.writeUint8(0); // padding 8
  writer.writeUint16(0); // padding 16
  writer.writeFloat32(a.eZ);
  writer.writeFloat32(a.eX);
  writer.writeFloat32(a.phase);
  writer.writeUint32(0); // padding 32
}

function decodeVariableTransmitterParameter(
  reader: BinaryReader
): VariableTransmitterParameter {
  const recordType = reader.readUint32();
  const recordLength = reader.readUint16();
  const dataLength = recordLength - 6;
  const data = dataLength > 0 ? reader.readBytes(dataLength) : new Uint8Array(0);
  return {
    recordType,
    recordLength,
    data,
  };
}

function encodeVariableTransmitterParameter(
  writer: BinaryWriter,
  v: VariableTransmitterParameter
): void {
  const recordLength = 6 + v.data.byteLength;
  writer.writeUint32(v.recordType);
  writer.writeUint16(recordLength);
  if (v.data.length > 0) {
    writer.writeBytes(v.data);
  }
}

export function decodeTransmitterPdu(reader: BinaryReader): TransmitterPdu {
  const header = decodePduHeader(reader);
  const radioReferenceId = decodeEntityId(reader);
  const radioNumber = reader.readUint16();
  const radioType = decodeRadioType(reader);
  const transmitState = reader.readUint8();
  const inputSource = reader.readUint8();
  const numberOfVariableTransmitterParameterRecords = reader.readUint16();
  const antennaLocation = decodeVector3Double(reader);
  const relativeAntennaLocation = decodeVector3Float(reader);
  const antennaPatternType = reader.readUint16();
  const antennaPatternLength = reader.readUint16();
  const frequency = reader.readUint64();
  const transmitFrequencyBandwidth = reader.readFloat32();
  const power = reader.readFloat32();
  const modulationType = decodeModulationType(reader);
  const cryptoSystem = reader.readUint16();
  const cryptoKeyId = reader.readUint16();
  const lengthOfModulationParameters = reader.readUint8();
  reader.readUint8(); // padding 8 bits
  reader.readUint16(); // padding 16 bits
  const modulationParameters =
    lengthOfModulationParameters > 0
      ? reader.readBytes(lengthOfModulationParameters)
      : new Uint8Array(0);
  const antennaPattern = decodeBeamAntennaPattern(reader);
  const variableTransmitterParameters: VariableTransmitterParameter[] = [];
  for (let i = 0; i < numberOfVariableTransmitterParameterRecords; i++) {
    variableTransmitterParameters.push(
      decodeVariableTransmitterParameter(reader)
    );
  }
  return {
    header,
    radioReferenceId,
    radioNumber,
    radioType,
    transmitState,
    inputSource,
    numberOfVariableTransmitterParameterRecords,
    antennaLocation,
    relativeAntennaLocation,
    antennaPatternType,
    antennaPatternLength,
    frequency,
    transmitFrequencyBandwidth,
    power,
    modulationType,
    cryptoSystem,
    cryptoKeyId,
    lengthOfModulationParameters,
    modulationParameters,
    antennaPattern,
    variableTransmitterParameters,
  };
}

export function encodeTransmitterPdu(
  writer: BinaryWriter,
  pdu: TransmitterPdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.radioReferenceId);
  writer.writeUint16(pdu.radioNumber);
  encodeRadioType(writer, pdu.radioType);
  writer.writeUint8(pdu.transmitState);
  writer.writeUint8(pdu.inputSource);
  writer.writeUint16(pdu.numberOfVariableTransmitterParameterRecords);
  encodeVector3Double(writer, pdu.antennaLocation);
  encodeVector3Float(writer, pdu.relativeAntennaLocation);
  writer.writeUint16(pdu.antennaPatternType);
  writer.writeUint16(pdu.antennaPatternLength);
  writer.writeUint64(pdu.frequency);
  writer.writeFloat32(pdu.transmitFrequencyBandwidth);
  writer.writeFloat32(pdu.power);
  encodeModulationType(writer, pdu.modulationType);
  writer.writeUint16(pdu.cryptoSystem);
  writer.writeUint16(pdu.cryptoKeyId);
  writer.writeUint8(pdu.modulationParameters.byteLength);
  writer.writeUint8(0); // padding
  writer.writeUint16(0); // padding
  writer.writeBytes(pdu.modulationParameters);
  encodeBeamAntennaPattern(writer, pdu.antennaPattern);
  for (const v of pdu.variableTransmitterParameters) {
    encodeVariableTransmitterParameter(writer, v);
  }
  writer.patchUint16(8, writer.getOffset());
}
