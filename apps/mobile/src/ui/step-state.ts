export type StepState = "done" | "active" | "failed" | "pending";

export const stepState = (index: number, activeIndex: number, failed: boolean): StepState =>
  index < activeIndex ? "done" : index > activeIndex ? "pending" : failed ? "failed" : "active";
