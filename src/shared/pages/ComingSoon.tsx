export default function ComingSoon(props: { title: string }) {
  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="text-base font-semibold text-zinc-900">{props.title}</div>
        <div className="mt-2 text-sm text-zinc-600">Coming soon</div>
      </div>
    </div>
  );
}

