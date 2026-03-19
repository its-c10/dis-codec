/**
 * DIS protocol version 7 (IEEE 1278.1-2012 application protocols).
 * Version is implied by module path; add `dis8/constants.ts` etc. for other editions.
 */
export const PROTOCOL_VERSION = 7;

/** Entity Information protocol family. */
export const PROTOCOL_FAMILY_ENTITY_INFORMATION = 1;

/** Simulation Management protocol family. */
export const PROTOCOL_FAMILY_SIMULATION_MANAGEMENT = 5;

/** PDU type: Entity State. */
export const PDU_TYPE_ENTITY_STATE = 1;

/** PDU type: Create Entity. */
export const PDU_TYPE_CREATE_ENTITY = 11;

/** PDU type: Remove Entity. */
export const PDU_TYPE_REMOVE_ENTITY = 12;

/** PDU type: Start/Resume. */
export const PDU_TYPE_START_RESUME = 13;

/** PDU type: Stop/Freeze. */
export const PDU_TYPE_STOP_FREEZE = 14;

/** PDU type: Electromagnetic Emission. */
export const PDU_TYPE_ELECTROMAGNETIC_EMISSION = 23;

/** PDU type: Transmitter. */
export const PDU_TYPE_TRANSMITTER = 25;

/** Electromagnetic Emission protocol family. */
export const PROTOCOL_FAMILY_ELECTROMAGNETIC_EMISSION = 6;

/** Radio Communications protocol family. */
export const PROTOCOL_FAMILY_RADIO_COMMUNICATIONS = 4;

/** Start/Resume PDU total length on wire (bytes). */
export const START_RESUME_PDU_LENGTH = 44;

/** Stop/Freeze PDU total length on wire (bytes). */
export const STOP_FREEZE_PDU_LENGTH = 40;

/** Create Entity PDU total length on wire (bytes). */
export const CREATE_ENTITY_PDU_LENGTH = 28;

/** Remove Entity PDU total length on wire (bytes). */
export const REMOVE_ENTITY_PDU_LENGTH = 28;

/** Entity State PDU fixed portion in bytes (144). Total = 144 + 16*N for N variable parameters. */
export const ENTITY_STATE_PDU_FIXED_LENGTH = 144;

/** Variable parameter record size in bytes. */
export const ENTITY_STATE_VARIABLE_PARAMETER_RECORD_LENGTH = 16;

/** Transmitter PDU fixed portion in bytes (104). Total = 104 + M + A + sum of variable record sizes. */
export const TRANSMITTER_PDU_FIXED_LENGTH = 104;
