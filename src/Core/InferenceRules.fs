namespace Meticulous

open Meticulous.Ast

/// The catalog of named argument forms — the classic valid inference rules,
/// and the classic *fallacies* that imitate them.
///
/// Each form is written as a pattern: a little argument whose atoms (φ, ψ, χ, ω)
/// are *metavariables* standing for any formula whatsoever. Modus ponens works
/// just as well for `(a ∧ b) → c` as for `p → q`, and pattern matching against
/// these shapes is what lets the engine say "this is modus tollens" or, when an
/// argument is invalid, name the exact mistake.
///
/// This one catalog serves several purposes:
///   * recognition   — label the form of an argument the user wrote by hand
///   * fallacy naming — explain *why* an invalid argument fails
///   * proof search  — the rules are the moves available when deriving a proof
///   * snippets      — `/modus-ponens` in VS Code expands from the same data
module InferenceRules =

    /// Is this shape a valid inference, a known mistake, or — the historically
    /// delicate case — an Aristotelian syllogism that is valid only under
    /// *existential import* (the silent assumption that classes aren't empty)?
    type FormKind =
        | ValidForm
        | FallacyForm
        | ExistentialImportForm

    type ArgumentForm =
        { Name: string             // machine name, e.g. "modus-ponens" (used for /snippets)
          Title: string            // display name, e.g. "modus ponens"
          Aka: string              // traditional/Latin alias, e.g. "modus tollendo ponens" ("" if none)
          Premises: Formula list   // premise patterns (atoms are metavariables)
          Conclusion: Formula      // conclusion pattern
          Kind: FormKind
          Note: string }           // a one-line explanation shown in the preview

    // The metavariables. Using Greek letters makes patterns read like a logic
    // textbook: φ (phi), ψ (psi), χ (chi), ω (omega).
    let private φ = Atom "φ"
    let private ψ = Atom "ψ"
    let private χ = Atom "χ"
    let private ω = Atom "ω"

    // Categorical building blocks: capital Greek letters are *predicate-name*
    // metavariables and α is a *term* metavariable (see Recognition.matchPattern).
    // Φx reads "x is a Φ", Φα reads "α is a Φ" for some named individual α.
    let private Φx = Pred("Φ", [ "x" ])
    let private Ψx = Pred("Ψ", [ "x" ])
    let private Σx = Pred("Σ", [ "x" ])
    let private Φα = Pred("Φ", [ "α" ])
    let private Ψα = Pred("Ψ", [ "α" ])

    let forms: ArgumentForm list =
        [ // ---- valid inference rules ----
          { Name = "modus-ponens"
            Title = "modus ponens"
            Aka = "modus ponendo ponens"
            Premises = [ Implies(φ, ψ); φ ]
            Conclusion = ψ
            Kind = ValidForm
            Note = "From an if–then and its if, the then follows." }

          { Name = "modus-tollens"
            Title = "modus tollens"
            Aka = "modus tollendo tollens"
            Premises = [ Implies(φ, ψ); Not ψ ]
            Conclusion = Not φ
            Kind = ValidForm
            Note = "If the consequence failed, the condition cannot have held." }

          { Name = "hypothetical-syllogism"
            Title = "hypothetical syllogism"
            Aka = ""
            Premises = [ Implies(φ, ψ); Implies(ψ, χ) ]
            Conclusion = Implies(φ, χ)
            Kind = ValidForm
            Note = "Implication chains: if φ leads to ψ and ψ leads to χ, φ leads to χ." }

          { Name = "disjunctive-syllogism"
            Title = "disjunctive syllogism"
            Aka = "modus tollendo ponens"
            Premises = [ Or(φ, ψ); Not φ ]
            Conclusion = ψ
            Kind = ValidForm
            Note = "One of two options; the first is out; so it's the second — affirming by denying." }

          { Name = "ponendo-tollens"
            Title = "modus ponendo tollens"
            Aka = ""
            Premises = [ Not(And(φ, ψ)); φ ]
            Conclusion = Not ψ
            Kind = ValidForm
            Note = "The two can't both hold; the first does; so the second fails — denying by affirming." }

          { Name = "constructive-dilemma"
            Title = "constructive dilemma"
            Aka = ""
            Premises = [ Implies(φ, ψ); Implies(χ, ω); Or(φ, χ) ]
            Conclusion = Or(ψ, ω)
            Kind = ValidForm
            Note = "Either way one of the two conditions holds, so one of the two results does." }

          { Name = "proof-by-cases"
            Title = "proof by cases"
            Aka = "disjunction elimination"
            Premises = [ Or(φ, ψ); Implies(φ, χ); Implies(ψ, χ) ]
            Conclusion = χ
            Kind = ValidForm
            Note = "Whichever option holds, the same conclusion follows — so it follows outright." }

          { Name = "destructive-dilemma"
            Title = "destructive dilemma"
            Aka = ""
            Premises = [ Implies(φ, ψ); Implies(χ, ω); Or(Not ψ, Not ω) ]
            Conclusion = Or(Not φ, Not χ)
            Kind = ValidForm
            Note = "One of the two results fails, so one of the two conditions must fail." }

          { Name = "absorption"
            Title = "absorption"
            Aka = ""
            Premises = [ Implies(φ, ψ) ]
            Conclusion = Implies(φ, And(φ, ψ))
            Kind = ValidForm
            Note = "If φ brings ψ, then φ brings both itself and ψ." }

          { Name = "absorption-rev"
            Title = "absorption"
            Aka = ""
            Premises = [ Implies(φ, And(φ, ψ)) ]
            Conclusion = Implies(φ, ψ)
            Kind = ValidForm
            Note = "If φ brings both itself and ψ, it brings ψ." }

          { Name = "simplification"
            Title = "simplification"
            Aka = ""
            Premises = [ And(φ, ψ) ]
            Conclusion = φ
            Kind = ValidForm
            Note = "From a conjunction, take either half." }

          { Name = "conjunction"
            Title = "conjunction"
            Aka = ""
            Premises = [ φ; ψ ]
            Conclusion = And(φ, ψ)
            Kind = ValidForm
            Note = "Two things known separately are known together." }

          { Name = "addition"
            Title = "addition"
            Aka = ""
            Premises = [ φ ]
            Conclusion = Or(φ, ψ)
            Kind = ValidForm
            Note = "Anything true may be weakened to an 'or'." }

          { Name = "double-negation-intro"
            Title = "double negation (intro)"
            Aka = ""
            Premises = [ φ ]
            Conclusion = Not(Not φ)
            Kind = ValidForm
            Note = "What is true is not not-true." }

          { Name = "double-negation-elim"
            Title = "double negation (elim)"
            Aka = ""
            Premises = [ Not(Not φ) ]
            Conclusion = φ
            Kind = ValidForm
            Note = "Two negations cancel (classically)." }

          // ---- replacement rules: rewriting a formula into an equivalent shape ----
          { Name = "de-morgan-nand"
            Title = "De Morgan's law"
            Aka = ""
            Premises = [ Not(And(φ, ψ)) ]
            Conclusion = Or(Not φ, Not ψ)
            Kind = ValidForm
            Note = "'Not both' means at least one fails: negation flips ∧ into ∨." }

          { Name = "de-morgan-nor"
            Title = "De Morgan's law"
            Aka = ""
            Premises = [ Not(Or(φ, ψ)) ]
            Conclusion = And(Not φ, Not ψ)
            Kind = ValidForm
            Note = "'Neither' means each one fails: negation flips ∨ into ∧." }

          { Name = "de-morgan-nand-rev"
            Title = "De Morgan's law"
            Aka = ""
            Premises = [ Or(Not φ, Not ψ) ]
            Conclusion = Not(And(φ, ψ))
            Kind = ValidForm
            Note = "At least one fails, so they cannot both hold." }

          { Name = "de-morgan-nor-rev"
            Title = "De Morgan's law"
            Aka = ""
            Premises = [ And(Not φ, Not ψ) ]
            Conclusion = Not(Or(φ, ψ))
            Kind = ValidForm
            Note = "Each one fails, so neither holds." }

          { Name = "contraposition"
            Title = "contraposition"
            Aka = "transposition"
            Premises = [ Implies(φ, ψ) ]
            Conclusion = Implies(Not ψ, Not φ)
            Kind = ValidForm
            Note = "An implication and its contrapositive say the same thing." }

          { Name = "contraposition-rev"
            Title = "contraposition"
            Aka = "transposition"
            Premises = [ Implies(Not φ, Not ψ) ]
            Conclusion = Implies(ψ, φ)
            Kind = ValidForm
            Note = "An implication and its contrapositive say the same thing." }

          { Name = "material-implication"
            Title = "material implication"
            Aka = ""
            Premises = [ Implies(φ, ψ) ]
            Conclusion = Or(Not φ, ψ)
            Kind = ValidForm
            Note = "'If φ then ψ' just says: either φ fails, or ψ holds." }

          { Name = "material-implication-rev"
            Title = "material implication"
            Aka = ""
            Premises = [ Or(Not φ, ψ) ]
            Conclusion = Implies(φ, ψ)
            Kind = ValidForm
            Note = "'If φ then ψ' just says: either φ fails, or ψ holds." }

          { Name = "exportation"
            Title = "exportation"
            Aka = ""
            Premises = [ Implies(And(φ, ψ), χ) ]
            Conclusion = Implies(φ, Implies(ψ, χ))
            Kind = ValidForm
            Note = "'Both together give χ' is the same as 'the first gives: the second gives χ'." }

          { Name = "exportation-rev"
            Title = "exportation"
            Aka = "importation"
            Premises = [ Implies(φ, Implies(ψ, χ)) ]
            Conclusion = Implies(And(φ, ψ), χ)
            Kind = ValidForm
            Note = "'The first gives: the second gives χ' is the same as 'both together give χ'." }

          // ---- laws: theorems provable from no premises at all ----
          { Name = "excluded-middle"
            Title = "law of excluded middle"
            Aka = "tertium non datur"
            Premises = []
            Conclusion = Or(φ, Not φ)
            Kind = ValidForm
            Note = "Every proposition either holds or fails — there is no third option." }

          { Name = "non-contradiction"
            Title = "law of non-contradiction"
            Aka = ""
            Premises = []
            Conclusion = Not(And(φ, Not φ))
            Kind = ValidForm
            Note = "No proposition both holds and fails at once." }

          // ---- categorical syllogisms: the classic named moods --------------
          { Name = "universal-instantiation"
            Title = "universal instantiation"
            Aka = "singular syllogism"
            Premises = [ Forall("x", Implies(Φx, Ψx)); Φα ]
            Conclusion = Ψα
            Kind = ValidForm
            Note = "What holds of every Φ holds of this one in particular." }

          { Name = "barbara"
            Title = "Barbara"
            Aka = "AAA-1"
            Premises = [ Forall("x", Implies(Φx, Ψx)); Forall("x", Implies(Σx, Φx)) ]
            Conclusion = Forall("x", Implies(Σx, Ψx))
            Kind = ValidForm
            Note = "All Φ are Ψ; all Σ are Φ; so all Σ are Ψ — the first and firmest of the syllogisms." }

          { Name = "celarent"
            Title = "Celarent"
            Aka = "EAE-1"
            Premises = [ Forall("x", Implies(Φx, Not Ψx)); Forall("x", Implies(Σx, Φx)) ]
            Conclusion = Forall("x", Implies(Σx, Not Ψx))
            Kind = ValidForm
            Note = "No Φ are Ψ; all Σ are Φ; so no Σ are Ψ." }

          { Name = "darii"
            Title = "Darii"
            Aka = "AII-1"
            Premises = [ Forall("x", Implies(Φx, Ψx)); Exists("x", And(Σx, Φx)) ]
            Conclusion = Exists("x", And(Σx, Ψx))
            Kind = ValidForm
            Note = "All Φ are Ψ; some Σ are Φ; so some Σ are Ψ." }

          { Name = "ferio"
            Title = "Ferio"
            Aka = "EIO-1"
            Premises = [ Forall("x", Implies(Φx, Not Ψx)); Exists("x", And(Σx, Φx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ValidForm
            Note = "No Φ are Ψ; some Σ are Φ; so some Σ are not Ψ." }

          // -- second figure (the middle term is predicate of both premises) --
          { Name = "cesare"
            Title = "Cesare"
            Aka = "EAE-2"
            Premises = [ Forall("x", Implies(Ψx, Not Φx)); Forall("x", Implies(Σx, Φx)) ]
            Conclusion = Forall("x", Implies(Σx, Not Ψx))
            Kind = ValidForm
            Note = "No Ψ are Φ; all Σ are Φ; so no Σ are Ψ." }

          { Name = "camestres"
            Title = "Camestres"
            Aka = "AEE-2"
            Premises = [ Forall("x", Implies(Ψx, Φx)); Forall("x", Implies(Σx, Not Φx)) ]
            Conclusion = Forall("x", Implies(Σx, Not Ψx))
            Kind = ValidForm
            Note = "All Ψ are Φ; no Σ are Φ; so no Σ are Ψ." }

          { Name = "festino"
            Title = "Festino"
            Aka = "EIO-2"
            Premises = [ Forall("x", Implies(Ψx, Not Φx)); Exists("x", And(Σx, Φx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ValidForm
            Note = "No Ψ are Φ; some Σ are Φ; so some Σ are not Ψ." }

          { Name = "baroco"
            Title = "Baroco"
            Aka = "AOO-2"
            Premises = [ Forall("x", Implies(Ψx, Φx)); Exists("x", And(Σx, Not Φx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ValidForm
            Note = "All Ψ are Φ; some Σ are not Φ; so some Σ are not Ψ." }

          // -- third figure (the middle term is subject of both premises) --
          { Name = "disamis"
            Title = "Disamis"
            Aka = "IAI-3"
            Premises = [ Exists("x", And(Φx, Ψx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Ψx))
            Kind = ValidForm
            Note = "Some Φ are Ψ; all Φ are Σ; so some Σ are Ψ." }

          { Name = "datisi"
            Title = "Datisi"
            Aka = "AII-3"
            Premises = [ Forall("x", Implies(Φx, Ψx)); Exists("x", And(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Ψx))
            Kind = ValidForm
            Note = "All Φ are Ψ; some Φ are Σ; so some Σ are Ψ." }

          { Name = "bocardo"
            Title = "Bocardo"
            Aka = "OAO-3"
            Premises = [ Exists("x", And(Φx, Not Ψx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ValidForm
            Note = "Some Φ are not Ψ; all Φ are Σ; so some Σ are not Ψ." }

          { Name = "ferison"
            Title = "Ferison"
            Aka = "EIO-3"
            Premises = [ Forall("x", Implies(Φx, Not Ψx)); Exists("x", And(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ValidForm
            Note = "No Φ are Ψ; some Φ are Σ; so some Σ are not Ψ." }

          // -- fourth figure --
          { Name = "camenes"
            Title = "Camenes"
            Aka = "AEE-4"
            Premises = [ Forall("x", Implies(Ψx, Φx)); Forall("x", Implies(Φx, Not Σx)) ]
            Conclusion = Forall("x", Implies(Σx, Not Ψx))
            Kind = ValidForm
            Note = "All Ψ are Φ; no Φ are Σ; so no Σ are Ψ." }

          { Name = "dimaris"
            Title = "Dimaris"
            Aka = "IAI-4"
            Premises = [ Exists("x", And(Ψx, Φx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Ψx))
            Kind = ValidForm
            Note = "Some Ψ are Φ; all Φ are Σ; so some Σ are Ψ." }

          { Name = "fresison"
            Title = "Fresison"
            Aka = "EIO-4"
            Premises = [ Forall("x", Implies(Ψx, Not Φx)); Exists("x", And(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ValidForm
            Note = "No Ψ are Φ; some Φ are Σ; so some Σ are not Ψ." }

          // -- the four moods Aristotle accepted that modern logic does not:
          //    each silently assumes its subject or middle class is non-empty --
          { Name = "darapti"
            Title = "Darapti"
            Aka = "AAI-3"
            Premises = [ Forall("x", Implies(Φx, Ψx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Ψx))
            Kind = ExistentialImportForm
            Note = "All Φ are Ψ; all Φ are Σ; so some Σ are Ψ — valid for Aristotle, who read 'all Φ' as implying some Φ exist. Modern logic allows Φ to be empty, and then nothing follows: see the countermodel." }

          { Name = "felapton"
            Title = "Felapton"
            Aka = "EAO-3"
            Premises = [ Forall("x", Implies(Φx, Not Ψx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ExistentialImportForm
            Note = "No Φ are Ψ; all Φ are Σ; so some Σ are not Ψ — valid for Aristotle only: modern logic allows Φ to be empty, and then nothing follows." }

          { Name = "bramantip"
            Title = "Bramantip"
            Aka = "AAI-4"
            Premises = [ Forall("x", Implies(Ψx, Φx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Ψx))
            Kind = ExistentialImportForm
            Note = "All Ψ are Φ; all Φ are Σ; so some Σ are Ψ — valid for Aristotle only: modern logic allows Ψ to be empty, and then nothing follows." }

          { Name = "fesapo"
            Title = "Fesapo"
            Aka = "EAO-4"
            Premises = [ Forall("x", Implies(Ψx, Not Φx)); Forall("x", Implies(Φx, Σx)) ]
            Conclusion = Exists("x", And(Σx, Not Ψx))
            Kind = ExistentialImportForm
            Note = "No Ψ are Φ; all Φ are Σ; so some Σ are not Ψ — valid for Aristotle only: modern logic allows Φ to be empty, and then nothing follows." }

          // ---- modal rules (S5): reasoning about necessity and possibility ----
          { Name = "axiom-t"
            Title = "axiom T"
            Aka = "necessity elimination"
            Premises = [ Box φ ]
            Conclusion = φ
            Kind = ValidForm
            Note = "What is necessary is actually so." }

          { Name = "possibility-intro"
            Title = "possibility introduction"
            Aka = ""
            Premises = [ φ ]
            Conclusion = Diamond φ
            Kind = ValidForm
            Note = "What is actually so is possible." }

          { Name = "k-distribution"
            Title = "K distribution"
            Aka = ""
            Premises = [ Box(Implies(φ, ψ)); Box φ ]
            Conclusion = Box ψ
            Kind = ValidForm
            Note = "Necessity distributes over implication: a necessary if–then with a necessary if gives a necessary then." }

          { Name = "axiom-4"
            Title = "axiom 4"
            Aka = ""
            Premises = [ Box φ ]
            Conclusion = Box(Box φ)
            Kind = ValidForm
            Note = "What is necessary is necessarily necessary." }

          { Name = "axiom-5"
            Title = "axiom 5"
            Aka = ""
            Premises = [ Diamond φ ]
            Conclusion = Box(Diamond φ)
            Kind = ValidForm
            Note = "What is possible is necessarily possible — possibility doesn't vary between worlds (S5)." }

          { Name = "axiom-b"
            Title = "axiom B"
            Aka = ""
            Premises = [ φ ]
            Conclusion = Box(Diamond φ)
            Kind = ValidForm
            Note = "What is so is necessarily possible." }

          { Name = "s5-collapse"
            Title = "S5 collapse"
            Aka = ""
            Premises = [ Diamond(Box φ) ]
            Conclusion = Box φ
            Kind = ValidForm
            Note = "Possibly necessary is necessary — the load-bearing step of the modal ontological argument." }

          { Name = "dual-box"
            Title = "modal duality"
            Aka = ""
            Premises = [ Not(Diamond φ) ]
            Conclusion = Box(Not φ)
            Kind = ValidForm
            Note = "Not possible means necessarily not — ◇ and □ are two sides of one coin." }

          { Name = "dual-diamond"
            Title = "modal duality"
            Aka = ""
            Premises = [ Not(Box φ) ]
            Conclusion = Diamond(Not φ)
            Kind = ValidForm
            Note = "Not necessary means possibly not — □ and ◇ are two sides of one coin." }

          // ---- fallacies: invalid forms that *look* valid ----
          { Name = "illicit-necessitation"
            Title = "illicit necessitation"
            Aka = ""
            Premises = [ φ ]
            Conclusion = Box φ
            Kind = FallacyForm
            Note = "True doesn't mean necessarily true — the world could have been otherwise." }

          { Name = "actualizing-the-possible"
            Title = "actualizing the possible"
            Aka = ""
            Premises = [ Diamond φ ]
            Conclusion = φ
            Kind = FallacyForm
            Note = "Possible doesn't mean actual — some possibilities stay unrealized." }

          { Name = "necessity-of-the-consequent"
            Title = "necessity of the consequent"
            Aka = "modal scope fallacy"
            Premises = [ Box(Implies(φ, ψ)); φ ]
            Conclusion = Box ψ
            Kind = FallacyForm
            Note = "The necessity governs the whole if–then, not its then: a contingent if only yields a contingent then." }

          { Name = "affirming-the-consequent"
            Title = "affirming the consequent"
            Aka = ""
            Premises = [ Implies(φ, ψ); ψ ]
            Conclusion = φ
            Kind = FallacyForm
            Note = "ψ may hold for other reasons — the arrow only runs one way." }

          { Name = "denying-the-antecedent"
            Title = "denying the antecedent"
            Aka = ""
            Premises = [ Implies(φ, ψ); Not φ ]
            Conclusion = Not ψ
            Kind = FallacyForm
            Note = "Losing one reason for ψ does not disprove ψ." }

          { Name = "affirming-a-disjunct"
            Title = "affirming a disjunct"
            Aka = ""
            Premises = [ Or(φ, ψ); φ ]
            Conclusion = Not ψ
            Kind = FallacyForm
            Note = "An inclusive 'or' allows both sides to be true at once." }

          { Name = "illicit-conversion"
            Title = "illicit conversion"
            Aka = ""
            Premises = [ Implies(φ, ψ) ]
            Conclusion = Implies(ψ, φ)
            Kind = FallacyForm
            Note = "An implication does not run backwards." }

          { Name = "undistributed-middle"
            Title = "undistributed middle"
            Aka = ""
            Premises = [ Forall("x", Implies(Φx, Ψx)); Forall("x", Implies(Σx, Ψx)) ]
            Conclusion = Forall("x", Implies(Σx, Φx))
            Kind = FallacyForm
            Note = "Sharing a predicate doesn't connect two classes — all cats and all dogs are animals, yet no dogs are cats." } ]

    let validForms = forms |> List.filter (fun f -> f.Kind = ValidForm)
    let fallacies = forms |> List.filter (fun f -> f.Kind = FallacyForm)
    let existentialImportForms = forms |> List.filter (fun f -> f.Kind = ExistentialImportForm)
