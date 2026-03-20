import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";
import type { EntityId } from "../core/entityId.js";
import { decodeEntityId, encodeEntityId } from "../core/entityId.js";
import type { EventId } from "../core/eventId.js";
import { decodeEventId, encodeEventId } from "../core/eventId.js";
import { decodePduHeader, encodePduHeader } from "./pduHeader.js";
import type { PduHeader } from "./pduHeader.js";

/** Fundamental parameter data for one beam (five float32s). */
export interface FundamentalParameterData {
  frequency: number;
  frequencyRange: number;
  effectiveRadiatedPower: number;
  pulseRepetitionFrequency: number;
  pulseWidth: number;
}

/** Beam data group (azimuth/elevation center and sweep, sync). */
export interface BeamDataGroup {
  beamAzimuthCenter: number;
  beamAzimuthSweep: number;
  beamElevationCenter: number;
  beamElevationSweep: number;
  beamSweepSync: number;
}

/** Beam data record (repeats M_i times per emitter system). */
export interface BeamData {
  /** Length in octets of beam data (beamNumber through beamStatus). Set automatically during encode. */
  beamDataLength?: number;
  beamNumber: number;
  beamParameterIndex: number;
  fundamentalParameterData: FundamentalParameterData;
  beamData: BeamDataGroup;
  beamFunction: number;
  numberOfTargets: number;
  highDensityTrackJam: number;
  beamStatus: number;
}

/** Emitter system (name, function, number) and location. */
export interface EmitterSystemRecord {
  emitterName: number;
  emitterFunction: number;
  emitterNumber: number;
}

/** Location with respect to entity (x, y, z float32). */
export interface Location {
  x: number;
  y: number;
  z: number;
}

/** One emitter system: fixed fields plus M beams. */
export interface EmitterSystemData {
  /** Length in octets of emitter system data (numberOfBeams through beams). Set automatically during encode. */
  systemDataLength?: number;
  numberOfBeams: number;
  padding: number;
  emitterSystem: EmitterSystemRecord;
  location: Location;
  beams: BeamData[];
}

/**
 * Electromagnetic Emission (EE) PDU (Table 161).
 * Header (96 bits), emitting entity ID, event ID, state/count, then N emitter system data blocks.
 */
export interface ElectromagneticEmissionPdu {
  header: PduHeader;
  emittingEntityId: EntityId;
  eventId: EventId;
  /** 8-bit enumeration. */
  stateUpdateIndicator: number;
  /** Number of emitter systems (N). */
  numberOfSystems: number;
  /** 16-bit padding. */
  padding: number;
  emitterSystems: EmitterSystemData[];
}

function decodeFundamentalParameterData(reader: BinaryReader): FundamentalParameterData {
  return {
    frequency: reader.readFloat32(),
    frequencyRange: reader.readFloat32(),
    effectiveRadiatedPower: reader.readFloat32(),
    pulseRepetitionFrequency: reader.readFloat32(),
    pulseWidth: reader.readFloat32(),
  };
}

function encodeFundamentalParameterData(
  writer: BinaryWriter,
  data: FundamentalParameterData
): void {
  writer.writeFloat32(data.frequency);
  writer.writeFloat32(data.frequencyRange);
  writer.writeFloat32(data.effectiveRadiatedPower);
  writer.writeFloat32(data.pulseRepetitionFrequency);
  writer.writeFloat32(data.pulseWidth);
}

function decodeBeamDataGroup(reader: BinaryReader): BeamDataGroup {
  return {
    beamAzimuthCenter: reader.readFloat32(),
    beamAzimuthSweep: reader.readFloat32(),
    beamElevationCenter: reader.readFloat32(),
    beamElevationSweep: reader.readFloat32(),
    beamSweepSync: reader.readFloat32(),
  };
}

function encodeBeamDataGroup(
  writer: BinaryWriter,
  data: BeamDataGroup
): void {
  writer.writeFloat32(data.beamAzimuthCenter);
  writer.writeFloat32(data.beamAzimuthSweep);
  writer.writeFloat32(data.beamElevationCenter);
  writer.writeFloat32(data.beamElevationSweep);
  writer.writeFloat32(data.beamSweepSync);
}

function decodeBeamData(reader: BinaryReader): BeamData {
  return {
    beamDataLength: reader.readUint8(),
    beamNumber: reader.readUint8(),
    beamParameterIndex: reader.readUint16(),
    fundamentalParameterData: decodeFundamentalParameterData(reader),
    beamData: decodeBeamDataGroup(reader),
    beamFunction: reader.readUint8(),
    numberOfTargets: reader.readUint8(),
    highDensityTrackJam: reader.readUint8(),
    beamStatus: reader.readUint8(),
  };
}

function encodeBeamData(writer: BinaryWriter, beam: BeamData): void {
  const lengthOffset = writer.getOffset();
  writer.writeUint8(0); // placeholder; patched below
  writer.writeUint8(beam.beamNumber);
  writer.writeUint16(beam.beamParameterIndex);
  encodeFundamentalParameterData(writer, beam.fundamentalParameterData);
  encodeBeamDataGroup(writer, beam.beamData);
  writer.writeUint8(beam.beamFunction);
  writer.writeUint8(beam.numberOfTargets);
  writer.writeUint8(beam.highDensityTrackJam);
  writer.writeUint8(beam.beamStatus);
  writer.patchUint8(lengthOffset, writer.getOffset() - lengthOffset - 1);
}

function decodeEmitterSystemData(reader: BinaryReader): EmitterSystemData {
  const systemDataLength = reader.readUint8();
  const numberOfBeams = reader.readUint8();
  const padding = reader.readUint16();
  const emitterSystem: EmitterSystemRecord = {
    emitterName: reader.readUint16(),
    emitterFunction: reader.readUint8(),
    emitterNumber: reader.readUint8(),
  };
  const location: Location = {
    x: reader.readFloat32(),
    y: reader.readFloat32(),
    z: reader.readFloat32(),
  };
  const beams: BeamData[] = [];
  for (let j = 0; j < numberOfBeams; j++) {
    beams.push(decodeBeamData(reader));
  }
  return {
    systemDataLength,
    numberOfBeams,
    padding,
    emitterSystem,
    location,
    beams,
  };
}

function encodeEmitterSystemData(
  writer: BinaryWriter,
  sys: EmitterSystemData
): void {
  const lengthOffset = writer.getOffset();
  writer.writeUint8(0); // placeholder; patched below
  writer.writeUint8(sys.numberOfBeams);
  writer.writeUint16(sys.padding);
  writer.writeUint16(sys.emitterSystem.emitterName);
  writer.writeUint8(sys.emitterSystem.emitterFunction);
  writer.writeUint8(sys.emitterSystem.emitterNumber);
  writer.writeFloat32(sys.location.x);
  writer.writeFloat32(sys.location.y);
  writer.writeFloat32(sys.location.z);
  for (const beam of sys.beams) {
    encodeBeamData(writer, beam);
  }
  writer.patchUint8(lengthOffset, writer.getOffset() - lengthOffset - 1);
}

export function decodeElectromagneticEmissionPdu(
  reader: BinaryReader
): ElectromagneticEmissionPdu {
  const header = decodePduHeader(reader);
  const emittingEntityId = decodeEntityId(reader);
  const eventId = decodeEventId(reader);
  const stateUpdateIndicator = reader.readUint8();
  const numberOfSystems = reader.readUint8();
  const padding = reader.readUint16();
  const emitterSystems: EmitterSystemData[] = [];
  for (let i = 0; i < numberOfSystems; i++) {
    emitterSystems.push(decodeEmitterSystemData(reader));
  }
  return {
    header,
    emittingEntityId,
    eventId,
    stateUpdateIndicator,
    numberOfSystems,
    padding,
    emitterSystems,
  };
}

export function encodeElectromagneticEmissionPdu(
  writer: BinaryWriter,
  pdu: ElectromagneticEmissionPdu
): void {
  encodePduHeader(writer, pdu.header);
  encodeEntityId(writer, pdu.emittingEntityId);
  encodeEventId(writer, pdu.eventId);
  writer.writeUint8(pdu.stateUpdateIndicator);
  writer.writeUint8(pdu.numberOfSystems);
  writer.writeUint16(pdu.padding);
  for (const sys of pdu.emitterSystems) {
    encodeEmitterSystemData(writer, sys);
  }
  writer.patchUint16(8, writer.getOffset());
}
