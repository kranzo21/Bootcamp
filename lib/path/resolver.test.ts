import { resolvePath } from "./resolver";
import type { Instrument, Path } from "@/types";

describe("resolvePath", () => {
  it("returns instrumentalist when klavier is selected", () => {
    expect(resolvePath(["klavier"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when gitarre is selected", () => {
    expect(resolvePath(["gitarre"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when e-gitarre is selected", () => {
    expect(resolvePath(["e-gitarre"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when bass is selected", () => {
    expect(resolvePath(["bass"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when geige is selected", () => {
    expect(resolvePath(["geige"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when tonal instrument mixed with vocals", () => {
    expect(resolvePath(["gitarre", "vocals"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when tonal instrument mixed with drums", () => {
    expect(resolvePath(["klavier", "drums"])).toBe<Path>("instrumentalist");
  });

  it("returns vocals when only vocals selected", () => {
    expect(resolvePath(["vocals"])).toBe<Path>("vocals");
  });

  it("returns drums when only drums selected", () => {
    expect(resolvePath(["drums"])).toBe<Path>("drums");
  });
});
