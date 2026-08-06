"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { BankTransferState } from "@/lib/bankTransfer";

interface BankTransferFormProps {
  state: BankTransferState;
}

const FIELD =
  "w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary";
const LABEL = "mb-1 block text-sm font-bold text-foreground";

export function BankTransferForm({ state }: BankTransferFormProps) {
  const router = useRouter();
  const [holder, setHolder] = useState(state.holder);
  const [iban, setIban] = useState(state.iban);
  const [bic, setBic] = useState(state.bic);
  const [bank, setBank] = useState(state.bank);
  const [instructionsDe, setInstructionsDe] = useState(state.instructions.de);
  const [instructionsEn, setInstructionsEn] = useState(state.instructions.en);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const response = await fetch("/api/admin/bank-transfer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holder, iban, bic, bank, instructionsDe, instructionsEn }),
    });
    setPending(false);

    const data = (await response.json().catch(() => null)) as
      | { error?: string; settings?: BankTransferState }
      | null;

    if (!response.ok) {
      setError(data?.error ?? "Échec de l'enregistrement.");
      return;
    }

    // L'IBAN revient normalisé (majuscules, blocs de quatre) : on réaffiche la
    // valeur enregistrée plutôt que la frappe du vendeur.
    if (data?.settings) {
      setIban(data.settings.iban);
      setBic(data.settings.bic);
      setInstructionsDe(data.settings.instructions.de);
      setInstructionsEn(data.settings.instructions.en);
    }
    setNotice("Coordonnées du virement enregistrées.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-sm border border-border bg-white p-4 md:p-6">
      {!state.configured && (
        <p className="mb-5 rounded-sm border border-destructive bg-destructive/5 px-3 py-2 text-xs text-foreground">
          <span className="font-bold text-destructive">Coordonnées de démonstration — </span>
          l&apos;IBAN ci-dessous est un jeu de test et n&apos;appartient à aucun compte. Tant
          qu&apos;il n&apos;est pas remplacé, le client voit un avertissement sur sa page de
          confirmation et aucun virement ne peut aboutir.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Titulaire du compte</span>
          <input
            value={holder}
            onChange={(event) => setHolder(event.target.value)}
            className={FIELD}
            placeholder="Hausgeräte Pfeffer OHG"
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className={LABEL}>
            Banque <span className="font-semibold text-muted-foreground">(facultatif)</span>
          </span>
          <input
            value={bank}
            onChange={(event) => setBank(event.target.value)}
            className={FIELD}
            placeholder="Commerzbank"
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className={LABEL}>IBAN</span>
          <input
            value={iban}
            onChange={(event) => setIban(event.target.value)}
            className={`${FIELD} font-mono`}
            placeholder="DE89 3704 0044 0532 0130 00"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <label className="block">
          <span className={LABEL}>BIC / SWIFT</span>
          <input
            value={bic}
            onChange={(event) => setBic(event.target.value)}
            className={`${FIELD} font-mono`}
            placeholder="COBADEFFXXX"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      {/* Texte affiché au-dessus des coordonnées. Le numéro de commande sert de
          référence du virement : il est proposé comme repère plutôt que laissé
          à la charge du vendeur, qui ne peut pas le connaître à l'avance. */}
      <fieldset className="mt-6 border-t border-border pt-5">
        <legend className="sr-only">Texte des instructions</legend>
        <h4 className="mb-1 text-sm font-black text-foreground">Texte affiché au client</h4>
        <p className="mb-3 text-xs text-muted-foreground">
          Phrase placée au-dessus des coordonnées, sur la page de confirmation et dans l&apos;e-mail.
          Deux repères sont remplacés automatiquement :{" "}
          <span className="font-mono font-bold">{"{total}"}</span> par le montant à virer et{" "}
          <span className="font-mono font-bold">{"{orderNumber}"}</span> par le numéro de commande.
          Un champ laissé vide reprend la formulation d&apos;origine.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className={LABEL}>Allemand — clients de la boutique</span>
            <textarea
              value={instructionsDe}
              onChange={(event) => setInstructionsDe(event.target.value)}
              rows={3}
              className={`${FIELD} leading-relaxed`}
            />
          </label>

          <label className="block">
            <span className={LABEL}>Anglais — commandes passées sur /en</span>
            <textarea
              value={instructionsEn}
              onChange={(event) => setInstructionsEn(event.target.value)}
              rows={3}
              className={`${FIELD} leading-relaxed`}
            />
          </label>
        </div>
      </fieldset>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>}
      {notice && <p className="mt-4 text-sm font-semibold text-[#16a34a]">{notice}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer les coordonnées"}
      </button>
    </form>
  );
}
