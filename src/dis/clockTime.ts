import type { BinaryReader } from "../binary/BinaryReader.js";
import type { BinaryWriter } from "../binary/BinaryWriter.js";

/**
 * DIS Clock Time record (hour + time past the hour).
 * Wire: int32 hour, uint32 time-past-hour (big-endian). Shared across many PDUs.
 */
export interface ClockTime {
  /** Whole hours since origin (signed). */
  hour: number;
  /** Microseconds (or PDU-specific unit) past the hour (unsigned). */
  timePastHour: number;
}

export function decodeClockTime(reader: BinaryReader): ClockTime {
  return {
    hour: reader.readInt32(),
    timePastHour: reader.readUint32(),
  };
}

export function encodeClockTime(writer: BinaryWriter, value: ClockTime): void {
  writer.writeInt32(value.hour);
  writer.writeUint32(value.timePastHour);
}
