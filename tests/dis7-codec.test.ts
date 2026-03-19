import { describe, expect, it } from "vitest";
import { BinaryReader } from "../src/binary/BinaryReader.js";
import { BinaryWriter } from "../src/binary/BinaryWriter.js";
import { decodeEntityId, encodeEntityId } from "../src/core/entityId.js";
import * as dis7 from "../src/dis7/index.js";

describe("BinaryReader", () => {
  it("reads big-endian uint16 correctly", () => {
    const buf = new Uint8Array([0x12, 0x34]).buffer;
    const r = new BinaryReader(buf);
    expect(r.readUint16()).toBe(0x1234);
    expect(r.getOffset()).toBe(2);
  });

  it("throws on read past end", () => {
    const r = new BinaryReader(new ArrayBuffer(1));
    expect(() => r.readUint16()).toThrow(RangeError);
  });
});

describe("BinaryWriter", () => {
  it("writes big-endian uint16 correctly", () => {
    const w = new BinaryWriter();
    w.writeUint16(0x1234);
    expect(new Uint8Array(w.toArrayBuffer())).toEqual(
      new Uint8Array([0x12, 0x34])
    );
  });
});

describe("EntityId", () => {
  it("decodeEntityId reads site, application, entity", () => {
    const bytes = new Uint8Array([
      0x00, 0x01,
      0x00, 0x02,
      0x03, 0xe8,
    ]);
    const r = new BinaryReader(bytes.buffer);
    expect(decodeEntityId(r)).toEqual({
      simulationAddress: { site: 1, application: 2 },
      entity: 1000,
    });
    expect(r.getOffset()).toBe(6);
  });

  it("encodeEntityId writes expected bytes", () => {
    const w = new BinaryWriter();
    encodeEntityId(w, {
      simulationAddress: { site: 1, application: 2 },
      entity: 1000,
    });
    expect(new Uint8Array(w.toArrayBuffer())).toEqual(
      new Uint8Array([0x00, 0x01, 0x00, 0x02, 0x03, 0xe8])
    );
  });

  it("round-trip encode then decode", () => {
    const id = {
      simulationAddress: { site: 0xffff, application: 0 },
      entity: 42,
    };
    const w = new BinaryWriter();
    encodeEntityId(w, id);
    const r = new BinaryReader(w.toArrayBuffer());
    expect(decodeEntityId(r)).toEqual(id);
  });
});

describe("DIS 7 Start/Resume PDU", () => {
  const samplePdu: dis7.StartResumePdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 2,
      pduType: dis7.PDU_TYPE_START_RESUME,
      protocolFamily: dis7.PROTOCOL_FAMILY_SIMULATION_MANAGEMENT,
      timestamp: 0x89abcdef,
      length: dis7.START_RESUME_PDU_LENGTH,
      pduStatus: 0,
      padding: 0,
    },
    originatingId: {
      simulationAddress: { site: 1, application: 2 },
      entity: 3,
    },
    receivingId: {
      simulationAddress: { site: 4, application: 5 },
      entity: 6,
    },
    realWorldTime: { hour: -1, timePastHour: 100 },
    simulationTime: { hour: 0, timePastHour: 0 },
    requestId: 0xdeadbeef,
  };

  it("encodes header with PDU type 13, family 5, length 44", () => {
    const w = new BinaryWriter();
    dis7.encodeStartResumePdu(w, samplePdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8.length).toBe(44);
    expect(u8[0]).toBe(7); // protocol version
    expect(u8[1]).toBe(2); // exercise
    expect(u8[2]).toBe(13); // PDU type
    expect(u8[3]).toBe(5); // family
    // timestamp @ 4–7, length uint16 BE @ 8–9
    expect(u8[8]).toBe(0);
    expect(u8[9]).toBe(44);
    expect(u8[10]).toBe(0); // pduStatus
    expect(u8[11]).toBe(0); // padding
  });

  it("round-trips StartResumePdu", () => {
    const w = new BinaryWriter();
    dis7.encodeStartResumePdu(w, samplePdu);
    const r = new BinaryReader(w.toArrayBuffer());
    expect(dis7.decodeStartResumePdu(r)).toEqual(samplePdu);
    expect(r.getOffset()).toBe(44);
  });
});

describe("DIS 7 Stop/Freeze PDU", () => {
  const samplePdu: dis7.StopFreezePdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 1,
      pduType: dis7.PDU_TYPE_STOP_FREEZE,
      protocolFamily: dis7.PROTOCOL_FAMILY_SIMULATION_MANAGEMENT,
      timestamp: 0,
      length: dis7.STOP_FREEZE_PDU_LENGTH,
      pduStatus: 0,
      padding: 0,
    },
    originatingId: {
      simulationAddress: { site: 1, application: 0 },
      entity: 1,
    },
    receivingId: {
      simulationAddress: { site: 0, application: 0 },
      entity: 0,
    },
    realWorldTime: { hour: 0, timePastHour: 0 },
    reason: 1,
    frozenBehavior: 0,
    padding: 0,
    requestId: 42,
  };

  it("encodes header with PDU type 14, length 40", () => {
    const w = new BinaryWriter();
    dis7.encodeStopFreezePdu(w, samplePdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8.length).toBe(40);
    expect(u8[2]).toBe(14); // PDU type
    expect(u8[8]).toBe(0);
    expect(u8[9]).toBe(40); // length BE
  });

  it("round-trips StopFreezePdu", () => {
    const w = new BinaryWriter();
    dis7.encodeStopFreezePdu(w, samplePdu);
    const r = new BinaryReader(w.toArrayBuffer());
    expect(dis7.decodeStopFreezePdu(r)).toEqual(samplePdu);
    expect(r.getOffset()).toBe(40);
  });
});

describe("DIS 7 Create Entity PDU", () => {
  const samplePdu: dis7.CreateEntityPdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 1,
      pduType: dis7.PDU_TYPE_CREATE_ENTITY,
      protocolFamily: dis7.PROTOCOL_FAMILY_SIMULATION_MANAGEMENT,
      timestamp: 0,
      length: dis7.CREATE_ENTITY_PDU_LENGTH,
      pduStatus: 0,
      padding: 0,
    },
    originatingId: {
      simulationAddress: { site: 1, application: 2 },
      entity: 10,
    },
    receivingId: {
      simulationAddress: { site: 0, application: 0 },
      entity: 0,
    },
    requestId: 0xdeadbeef,
  };

  it("encodes header with PDU type 11, family 5, length 28", () => {
    const w = new BinaryWriter();
    dis7.encodeCreateEntityPdu(w, samplePdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8.length).toBe(28);
    expect(u8[2]).toBe(11);
    expect(u8[3]).toBe(5);
    expect(u8[8]).toBe(0);
    expect(u8[9]).toBe(28);
  });

  it("round-trips CreateEntityPdu", () => {
    const w = new BinaryWriter();
    dis7.encodeCreateEntityPdu(w, samplePdu);
    const r = new BinaryReader(w.toArrayBuffer());
    expect(dis7.decodeCreateEntityPdu(r)).toEqual(samplePdu);
    expect(r.getOffset()).toBe(28);
  });
});

describe("DIS 7 Remove Entity PDU", () => {
  const samplePdu: dis7.RemoveEntityPdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 1,
      pduType: dis7.PDU_TYPE_REMOVE_ENTITY,
      protocolFamily: dis7.PROTOCOL_FAMILY_SIMULATION_MANAGEMENT,
      timestamp: 0,
      length: dis7.REMOVE_ENTITY_PDU_LENGTH,
      pduStatus: 0,
      padding: 0,
    },
    originatingId: {
      simulationAddress: { site: 1, application: 2 },
      entity: 10,
    },
    receivingId: {
      simulationAddress: { site: 0, application: 0 },
      entity: 0,
    },
    requestId: 42,
  };

  it("encodes header with PDU type 12, family 5, length 28", () => {
    const w = new BinaryWriter();
    dis7.encodeRemoveEntityPdu(w, samplePdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8.length).toBe(28);
    expect(u8[2]).toBe(12);
    expect(u8[3]).toBe(5);
    expect(u8[9]).toBe(28);
  });

  it("round-trips RemoveEntityPdu", () => {
    const w = new BinaryWriter();
    dis7.encodeRemoveEntityPdu(w, samplePdu);
    const r = new BinaryReader(w.toArrayBuffer());
    expect(dis7.decodeRemoveEntityPdu(r)).toEqual(samplePdu);
    expect(r.getOffset()).toBe(28);
  });
});

describe("DIS 7 Electromagnetic Emission PDU", () => {
  const sampleEePdu: dis7.ElectromagneticEmissionPdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 1,
      pduType: dis7.PDU_TYPE_ELECTROMAGNETIC_EMISSION,
      protocolFamily: dis7.PROTOCOL_FAMILY_ELECTROMAGNETIC_EMISSION,
      timestamp: 1000,
      length: 0, // variable; set by encoder or left for caller
      pduStatus: 0,
      padding: 0,
    },
    emittingEntityId: {
      simulationAddress: { site: 1, application: 2 },
      entity: 10,
    },
    eventId: {
      simulationAddress: { site: 1, application: 2 },
      event: 1,
    },
    stateUpdateIndicator: 0,
    numberOfSystems: 1,
    padding: 0,
    emitterSystems: [
      {
        systemDataLength: 24,
        numberOfBeams: 1,
        padding: 0,
        emitterSystem: {
          emitterName: 0,
          emitterFunction: 0,
          emitterNumber: 0,
        },
        location: { x: 0, y: 0, z: 0 },
        beams: [
          {
            beamDataLength: 40,
            beamNumber: 0,
            beamParameterIndex: 0,
            fundamentalParameterData: {
              frequency: 1e9,
              frequencyRange: 1e6,
              effectiveRadiatedPower: 100,
              pulseRepetitionFrequency: 1000,
              pulseWidth: 1,
            },
            beamData: {
              beamAzimuthCenter: 0,
              beamAzimuthSweep: 0,
              beamElevationCenter: 0,
              beamElevationSweep: 0,
              beamSweepSync: 0,
            },
            beamFunction: 0,
            numberOfTargets: 0,
            highDensityTrackJam: 0,
            beamStatus: 0,
          },
        ],
      },
    ],
  };

  it("encodes EE PDU with type 23 and family 6", () => {
    const w = new BinaryWriter();
    dis7.encodeElectromagneticEmissionPdu(w, sampleEePdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8[2]).toBe(23);
    expect(u8[3]).toBe(6);
  });

  it("round-trips ElectromagneticEmissionPdu", () => {
    const w = new BinaryWriter();
    dis7.encodeElectromagneticEmissionPdu(w, sampleEePdu);
    const r = new BinaryReader(w.toArrayBuffer());
    const decoded = dis7.decodeElectromagneticEmissionPdu(r);
    expect(decoded).toEqual({
      ...sampleEePdu,
      header: { ...sampleEePdu.header, length: w.getOffset() },
    });
    expect(r.getOffset()).toBe(w.getOffset());
  });
});

describe("DIS 7 Entity State PDU", () => {
  const zero15 = new Uint8Array(15);
  const zero11 = new Uint8Array(11);

  const sampleEntityStatePdu: dis7.EntityStatePdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 1,
      pduType: dis7.PDU_TYPE_ENTITY_STATE,
      protocolFamily: dis7.PROTOCOL_FAMILY_ENTITY_INFORMATION,
      timestamp: 0,
      length: dis7.ENTITY_STATE_PDU_FIXED_LENGTH,
      pduStatus: 0,
      padding: 0,
    },
    entityId: {
      simulationAddress: { site: 1, application: 2 },
      entity: 1,
    },
    forceId: 0,
    numberOfVariableParameterRecords: 0,
    entityType: {
      kind: 1,
      domain: 2,
      country: 222,
      category: 0,
      subcategory: 0,
      specific: 0,
      extra: 0,
    },
    alternateEntityType: {
      kind: 1,
      domain: 2,
      country: 222,
      category: 0,
      subcategory: 0,
      specific: 0,
      extra: 0,
    },
    entityLinearVelocity: { x: 0, y: 0, z: 0 },
    entityLocation: { x: 0, y: 0, z: 0 },
    entityOrientation: { psi: 0, theta: 0, phi: 0 },
    entityAppearance: 0,
    deadReckoningParameters: {
      deadReckoningAlgorithm: 1,
      otherParameters: zero15,
      entityLinearAcceleration: { x: 0, y: 0, z: 0 },
      entityAngularVelocity: { x: 0, y: 0, z: 0 },
    },
    entityMarking: {
      characterSet: 1,
      characters: zero11,
    },
    capabilities: 0,
    variableParameters: [],
  };

  it("encodes Entity State PDU with type 1 and family 1", () => {
    const w = new BinaryWriter();
    dis7.encodeEntityStatePdu(w, sampleEntityStatePdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8.length).toBe(dis7.ENTITY_STATE_PDU_FIXED_LENGTH);
    expect(u8[2]).toBe(1);
    expect(u8[3]).toBe(1);
  });

  it("round-trips EntityStatePdu with no variable parameters", () => {
    const w = new BinaryWriter();
    dis7.encodeEntityStatePdu(w, sampleEntityStatePdu);
    const r = new BinaryReader(w.toArrayBuffer());
    const decoded = dis7.decodeEntityStatePdu(r);
    expect(decoded).toEqual(sampleEntityStatePdu);
    expect(r.getOffset()).toBe(dis7.ENTITY_STATE_PDU_FIXED_LENGTH);
  });

  it("round-trips EntityStatePdu with one variable parameter", () => {
    const pdu: dis7.EntityStatePdu = {
      ...sampleEntityStatePdu,
      numberOfVariableParameterRecords: 1,
      variableParameters: [
        {
          recordType: 1,
          recordSpecific: new Uint8Array(15).fill(0),
        },
      ],
    };
    const w = new BinaryWriter();
    dis7.encodeEntityStatePdu(w, pdu);
    const expectedLength =
      dis7.ENTITY_STATE_PDU_FIXED_LENGTH +
      dis7.ENTITY_STATE_VARIABLE_PARAMETER_RECORD_LENGTH;
    const r = new BinaryReader(w.toArrayBuffer());
    const decoded = dis7.decodeEntityStatePdu(r);
    expect(decoded).toEqual({
      ...pdu,
      header: { ...pdu.header, length: expectedLength },
    });
    expect(r.getOffset()).toBe(expectedLength);
  });
});

describe("DIS 7 Transmitter PDU", () => {
  const sampleTransmitterPdu: dis7.TransmitterPdu = {
    header: {
      protocolVersion: dis7.PROTOCOL_VERSION,
      exerciseId: 1,
      pduType: dis7.PDU_TYPE_TRANSMITTER,
      protocolFamily: dis7.PROTOCOL_FAMILY_RADIO_COMMUNICATIONS,
      timestamp: 0,
      length: dis7.TRANSMITTER_PDU_FIXED_LENGTH,
      pduStatus: 0,
      padding: 0,
    },
    radioReferenceId: {
      simulationAddress: { site: 1, application: 2 },
      entity: 1,
    },
    radioNumber: 0,
    radioType: {
      entityKind: 0,
      domain: 0,
      country: 0,
      category: 0,
      subcategory: 0,
      specific: 0,
      extra: 0,
    },
    transmitState: 0,
    inputSource: 0,
    numberOfVariableTransmitterParameterRecords: 0,
    antennaLocation: { x: 0, y: 0, z: 0 },
    relativeAntennaLocation: { x: 0, y: 0, z: 0 },
    antennaPatternType: 0,
    antennaPatternLength: dis7.BEAM_ANTENNA_PATTERN_LENGTH,
    frequency: 0n,
    transmitFrequencyBandwidth: 0,
    power: 0,
    modulationType: {
      spreadSpectrum: 0,
      majorModulation: 0,
      detail: 0,
      radioSystem: 0,
    },
    cryptoSystem: 0,
    cryptoKeyId: 0,
    lengthOfModulationParameters: 0,
    modulationParameters: new Uint8Array(0),
    antennaPattern: {
      beamDirection: { psi: 0, theta: 0, phi: 0 },
      azimuthBeamwidth: 0,
      elevationBeamwidth: 0,
      referenceSystem: 0,
      eZ: 0,
      eX: 0,
      phase: 0,
    },
    variableTransmitterParameters: [],
  };

  const transmitterPduMinLength =
    dis7.TRANSMITTER_PDU_FIXED_LENGTH + dis7.BEAM_ANTENNA_PATTERN_LENGTH;

  it("encodes Transmitter PDU with type 25 and family 4", () => {
    const w = new BinaryWriter();
    dis7.encodeTransmitterPdu(w, sampleTransmitterPdu);
    const u8 = new Uint8Array(w.toArrayBuffer());
    expect(u8.length).toBe(transmitterPduMinLength);
    expect(u8[2]).toBe(25);
    expect(u8[3]).toBe(4);
  });

  it("round-trips TransmitterPdu with no variable records", () => {
    const w = new BinaryWriter();
    dis7.encodeTransmitterPdu(w, sampleTransmitterPdu);
    const r = new BinaryReader(w.toArrayBuffer());
    const decoded = dis7.decodeTransmitterPdu(r);
    expect(decoded).toEqual({
      ...sampleTransmitterPdu,
      header: { ...sampleTransmitterPdu.header, length: transmitterPduMinLength },
    });
    expect(r.getOffset()).toBe(transmitterPduMinLength);
  });

  it("round-trips TransmitterPdu with modulation data", () => {
    const pdu: dis7.TransmitterPdu = {
      ...sampleTransmitterPdu,
      lengthOfModulationParameters: 2,
      modulationParameters: new Uint8Array([0xab, 0xcd]),
    };
    const w = new BinaryWriter();
    dis7.encodeTransmitterPdu(w, pdu);
    const r = new BinaryReader(w.toArrayBuffer());
    const decoded = dis7.decodeTransmitterPdu(r);
    expect(decoded).toEqual({
      ...pdu,
      header: { ...pdu.header, length: w.getOffset() },
    });
  });
});
