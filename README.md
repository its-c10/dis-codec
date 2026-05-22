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
| Fire | `encodeFirePdu` / `decodeFirePdu` | 96 bytes; see [Warfare PDU descriptors](#warfare-pdu-descriptors) |
| Detonation | `encodeDetonationPdu` / `decodeDetonationPdu` | 104 + 16×N bytes; see [Warfare PDU descriptors](#warfare-pdu-descriptors) |
| Create Entity | `encodeCreateEntityPdu` / `decodeCreateEntityPdu` | 28 bytes |
| Remove Entity | `encodeRemoveEntityPdu` / `decodeRemoveEntityPdu` | 28 bytes |
| Start/Resume | `encodeStartResumePdu` / `decodeStartResumePdu` | 44 bytes |
| Stop/Freeze | `encodeStopFreezePdu` / `decodeStopFreezePdu` | 40 bytes |
| Electromagnetic Emission | `encodeElectromagneticEmissionPdu` / `decodeElectromagneticEmissionPdu` | Variable length |
| Transmitter | `encodeTransmitterPdu` / `decodeTransmitterPdu` | Variable length |
| Point Object State | `encodePointObjectStatePdu` / `decodePointObjectStatePdu` | 88 bytes |

Constants for PDU types, protocol families, and fixed lengths are available on `dis7` (for example `dis7.PDU_TYPE_ENTITY_STATE` and `dis7.CREATE_ENTITY_PDU_LENGTH`).

### Warfare PDU descriptors

Fire and Detonation PDUs include a 128-bit **descriptor** field. The IEEE format does **not** include a tag that says which layout was used—only the sending application knows.

| Layout | Tables | Used by |
|--------|--------|---------|
| Munition | 41 | Fire, Detonation |
| Explosion | 42 | Detonation only |
| Expendable | 43 | Fire, Detonation |

**Encode:** Set `descriptor.variant` to `"munition"`, `"explosion"`, or `"expendable"` and fill the matching nested object.

```ts
// Munition (Fire or Detonation)
descriptor: {
  variant: "munition",
  munition: {
    munitionType: { kind: 2, domain: 1, country: 225, category: 1, subcategory: 0, specific: 0, extra: 0 },
    warhead: 1000,
    fuse: 2000,
    quantity: 1,
    rate: 0,
  },
},

// Explosion (Detonation only)
descriptor: {
  variant: "explosion",
  explosion: {
    explodingObjectType: { kind: 1, domain: 0, country: 0, category: 4, subcategory: 0, specific: 0, extra: 0 },
    explosiveMaterial: 100,
    padding: 0,
    explosiveForce: 250.5,
  },
},
```

For expendable descriptors, `expendable.padding` must be exactly **8 bytes** (64 bits unused, typically all zeros). Use `dis7.EXPENDABLE_DESCRIPTOR_PADDING_BYTES`.

**Decode:** Pass `descriptorVariant` when you know the layout; otherwise the codec defaults to `"munition"`:

- `decodeFirePdu(reader, { descriptorVariant: "expendable" })`
- `decodeDetonationPdu(reader, { descriptorVariant: "explosion" })`

If the assumption is wrong, the trailing 64 bits are misinterpreted. The `variant` on the decoded object reflects your assumption, not the packet.

Detonation PDUs may also include **variable parameter** records (same 16-byte layout as Entity State). Total size is `dis7.detonationPduLength(N)` = 104 + 16×N bytes.

### Byte array requirements (important)

Some PDU fields are fixed-size byte arrays. These fields are public `number[]` values (JSON-safe), but they **must** be the exact required length when encoding:

- `entityMarking.characters`: **11 bytes**
- `deadReckoningParameters.otherParameters`: **15 bytes**
- `variableParameters[].recordSpecific`: **15 bytes**
- `descriptor.expendable.padding` (Fire / Detonation): **8 bytes**

For Entity Marking text, use the helper to create a valid 11-byte ASCII array:

```ts
const pdu: dis7.EntityStatePdu = {
  // ...
  entityMarking: {
    characterSet: 1,
    characters: dis7.entityMarkingStringToAsciiBytes("EAGLE11"),
  },
};
```

The encoder validates these lengths and throws a `RangeError` if they are incorrect.

### Data length fields

PDUs such as Electromagnetic Emission and Transmitter include length-in-octets fields (`beamDataLength`, `systemDataLength`, `recordLength`, `lengthOfModulationParameters`, etc.). The PDU header `length` field is also in this category. These are **computed and written automatically** during encode—you do not need to set them. The encoder writes a placeholder, encodes the payload, then patches the correct byte counts retroactively. When decoding, these fields are read from the wire and included in the returned object.

## Requirements

- ES2020+ (Node or browser)
- TypeScript types included

## License

MIT
