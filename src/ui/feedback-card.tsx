import type { GradeResult } from "../lesson/grader";

const SOURCE_LABEL = { on_device: "Graded on your device", in_cloud: "Graded in the cloud" } as const;

export const SourceBadge = ({ source }: { source: GradeResult["source"] }) => (
  <span className={`badge ${source === "on_device" ? "device" : "cloud"}`}>{SOURCE_LABEL[source]}</span>
);

export const FeedbackCard = ({ result }: { result: GradeResult }) => {
  const { grade, source } = result;
  return (
    <div className={`feedback ${grade.ok ? "ok" : "miss"}`}>
      <p className="feedback-title">{grade.ok ? "¡Muy bien! Nice one." : "Almost! Try again?"}</p>
      {result.transcript && (
        <p>
          <strong>We heard:</strong> <span lang="es">“{result.transcript}”</span>
        </p>
      )}
      <p>Score: {grade.score} / 100</p>
      {grade.correction && (
        <p>
          <strong>Better:</strong> <span lang="es">{grade.correction}</span>
        </p>
      )}
      {grade.hint && (
        <p>
          <strong>Hint:</strong> {grade.hint}
        </p>
      )}
      <SourceBadge source={source} />
    </div>
  );
};
