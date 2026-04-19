import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold text-brand mb-2">A table !</h1>
      <p className="text-slate-600 max-w-lg mb-8">
        Les clients scannent le QR code collé à leur table, commandent et payent
        directement. Vous gérez tout depuis un seul dashboard.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard" className="btn-primary">Dashboard pro</Link>
        <Link href="/login" className="btn-ghost">Connexion</Link>
      </div>
    </main>
  );
}
