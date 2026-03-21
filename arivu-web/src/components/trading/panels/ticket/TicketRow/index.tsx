interface Props {
  label: string;
  value: string;
}

export const TicketRow = ({ label, value }: Props) => {
  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-xs font-semibold text-neutral-100">{value}</div>
    </div>
  );
};
