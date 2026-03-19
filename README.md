# dis-codec

TypeScript encode/decode library for **Distributed Interactive Simulation (DIS)** with wire format aligned to IEEE 1278.1 (DIS application protocols).

This project focuses on a **practical subset of DIS 7 PDUs** (see list below). It is **not** an implementation of the full DIS specification.

## Install

```bash
npm install @its-c10/dis-codec
```

## Usage

**Encode a PDU and get bytes for UDP:**

```ts
import { BinaryWriter, dis7 } from "@its-c10/dis-codec";

const writer = new BinaryWriter();
dis7.encodeCreateEntityPdu(writer, {
  header: {
    protocolVersion: dis7.PROTOCOL_VERSION,
    exerciseId: 1,
    pduType: dis7.PDU_TYPE_CREATE_ENTITY,
    protocolFamily: dis7.PROTOCOL_FAMILY_SIMULATION_MANAGEMENT,
    timestamp: 0,
    length: 0, // ignored; encoder sets correct length automatically
    pduStatus: 0,
    padding: 0,
  },
  originatingId: { simulationAddress: { site: 1, application: 2 }, entity: 10 },
  receivingId: { simulationAddress: { site: 0, application: 0 }, entity: 0 },
  requestId: 1,
});

const bytes = new Uint8Array(writer.toArrayBuffer());
// Send bytes over UDP
```

**Decode a PDU from received bytes:**

```ts
import { BinaryReader, dis7 } from "@its-c10/dis-codec";

const reader = new BinaryReader(udpPacketBuffer);
const pdu = dis7.decodeEntityStatePdu(reader);
// Use pdu.entityId, pdu.entityLocation, etc.
```

**Switch on PDU type:**

```ts
const reader = new BinaryReader(buffer);
const header = dis7.decodePduHeader(reader);
reader.setOffset(0); // rewind to decode full PDU

if (header.pduType === dis7.PDU_TYPE_ENTITY_STATE) {
  const pdu = dis7.decodeEntityStatePdu(reader);
  // ...
} else if (header.pduType === dis7.PDU_TYPE_ELECTROMAGNETIC_EMISSION) {
  const pdu = dis7.decodeElectromagneticEmissionPdu(reader);
  // ...
}
```

## DIS 7 PDUs

| PDU | Encode / Decode | Notes |
|-----|-----------------|-------|
| Entity State | `encodeEntityStatePdu` / `decodeEntityStatePdu` | Variable length |
| Create Entity | `encodeCreateEntityPdu` / `decodeCreateEntityPdu` | 28 bytes |
| Remove Entity | `encodeRemoveEntityPdu` / `decodeRemoveEntityPdu` | 28 bytes |
| Start/Resume | `encodeStartResumePdu` / `decodeStartResumePdu` | 44 bytes |
| Stop/Freeze | `encodeStopFreezePdu` / `decodeStopFreezePdu` | 40 bytes |
| Electromagnetic Emission | `encodeElectromagneticEmissionPdu` / `decodeElectromagneticEmissionPdu` | Variable length |
| Transmitter | `encodeTransmitterPdu` / `decodeTransmitterPdu` | Variable length |

Constants for PDU types, protocol families, and fixed lengths are available on `dis7` (for example `dis7.PDU_TYPE_ENTITY_STATE` and `dis7.CREATE_ENTITY_PDU_LENGTH`).

## Requirements

- ES2020+ (Node or browser)
- TypeScript types included

## License

MIT
