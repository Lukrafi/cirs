import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const CONF_NAMES: Record<string, string> = {
  CONMEBOL: "Confederação Sul-Americana de Futebol",
  UEFA: "União das Associações Europeias de Futebol",
  CAF: "Confederação Africana de Futebol",
  AFC: "Confederação Asiática de Futebol",
  CONCACAF: "Confederação da América do Norte, Central e Caribe",
  OFC: "Confederação de Futebol da Oceania",
};

export default async function ConfederationPage({
  params,
}: {
  params: Promise<{ confedId: string }>;
}) {
  const { confedId } = await params;

  const confed = await prisma.confederation.findUnique({
    where: { id: confedId },
    include: {
      countries: {
        include: { leagues: true, divisions: true, clubs: { select: { id: true } } },
        orderBy: { name: "asc" },
      },
      leagues: true,
    },
  });

  if (!confed) notFound();

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/simulacoes" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para Simulações
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          {confed.logo ? (
            <img src={confed.logo} alt={confed.name} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center text-2xl font-black text-gold">
              {confed.code.slice(0, 3)}
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">Confederação</div>
            <h1 className="text-4xl font-black">{confed.name}</h1>
            <p className="text-muted mt-1">{CONF_NAMES[confed.code] || confed.name}</p>
            <p className="text-xs text-muted mt-2">{confed.countries.length} países filiados</p>
          </div>
        </div>
      </header>

      {confed.countries.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhum país cadastrado nesta confederação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {confed.countries.map((country) => (
            <Link
              key={country.id}
              href={`/simulacoes/${confedId}/${country.id}`}
              className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group text-center"
            >
              {country.flag ? (
                <img src={country.flag} alt={country.name} className="w-12 h-8 mx-auto rounded object-cover mb-2" />
              ) : (
                <div className="w-12 h-8 mx-auto rounded bg-blue-deep flex items-center justify-center mb-2">
                  <span className="text-[10px] font-bold text-gold">{country.code}</span>
                </div>
              )}
              <div className="text-sm font-medium truncate group-hover:text-gold transition-colors">{country.name}</div>
              <div className="text-[10px] text-muted mt-1">{country.leagues.length} ligas · {country.clubs.length} clubes</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}