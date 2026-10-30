export default function StageBadge({ stage }) {
  return <span className={`badge stage-${stage.replace(/\s/g, '').toLowerCase()}`}>{stage}</span>
}
