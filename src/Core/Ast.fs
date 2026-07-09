namespace Meticulous

/// The Abstract Syntax Tree (AST) for meticulous documents.
///
/// An AST is just a set of data types that describe the *shape* of a document
/// after we've read it. Parsing turns flat text into these structured values;
/// everything downstream (truth tables, rendering) works on the AST, never on
/// the raw text.
module Ast =

    /// A logical formula built from atomic propositions and connectives.
    /// This is the heart of the propositional layer. A `Formula` is a little
    /// tree — e.g. `p -> (q and r)` becomes `Implies(Atom "p", And(Atom "q", Atom "r"))`.
    type Formula =
        | Atom of string                    // a proposition variable, e.g. p
        | Const of bool                     // the constants ⊤ (true) and ⊥ (false)
        | Not of Formula                    // ¬φ
        | And of Formula * Formula          // φ ∧ ψ
        | Or of Formula * Formula           // φ ∨ ψ
        | Xor of Formula * Formula          // φ ⊕ ψ  (exclusive or)
        | Implies of Formula * Formula      // φ → ψ
        | Iff of Formula * Formula          // φ ↔ ψ  (if and only if)
        | Box of Formula                    // □φ — necessarily φ (true in every possible world)
        | Diamond of Formula                // ◇φ — possibly φ (true in some possible world)

    /// Where a `table` request points: either a named claim, or a formula
    /// written inline on the same line.
    type TableTarget =
        | TargetRef of string        // e.g.  table C1
        | TargetFormula of Formula   // e.g.  table (p -> q)

    /// The two kinds of `check` request.
    type CheckKind =
        | Verdict of Formula                 // check (p -> q)      -> is it a tautology?
        | Equivalent of Formula * Formula    // check A equivalent B -> are they the same?

    /// The structural relations a document can assert between statements.
    /// Three of them make formal claims the engine can verify; two are
    /// informal judgments it can only record.
    type RelationKind =
        | Supports      // informal: one statement lends weight to another
        | Presupposes   // informal: one statement silently relies on another
        | Contradicts   // formal: they can never both be true
        | Entails       // formal: whenever the first holds, so does the second
        | EquivalentTo  // formal: always the same truth value

    /// One end of a relation: a declared prop/claim name, or a quoted ad-hoc
    /// statement that hasn't been formalized ("The streets flood").
    type RelRef =
        | Named of string
        | Quoted of string

    /// One line of a user-written proof. Lines are numbered so later steps
    /// can cite the earlier ones they build on.
    type ProofLine =
        | ProofPremise of number: int * formula: Formula
                          // 1. premise rain -> wet
        | ProofDerived of number: int * formula: Formula * rule: string * refs: int list
                          // 3. wet   by modus-ponens from 1, 2

    /// A top-level statement — one meaningful line or block in a document.
    type Statement =
        | Heading of level: int * text: string   // # Title / ## Subtitle
        | Prose of string                          // any plain paragraph text
        | Prop of name: string * gloss: string     // prop p : It is raining
        | Claim of name: string * body: Formula    // claim C1 : p -> q
        | Table of TableTarget                      // table C1
        | Check of CheckKind                        // check ...
        | Argument of name: string * premises: Formula list * conclusion: Formula
                                                    // argument x { premise … / --- / conclude … }
        | Proof of name: string * lines: ProofLine list
                                                    // proof x { 1. premise … / 2. … by rule from 1 }
        | Analyze                                   // analyze — compare all claims pairwise
        | Relates of left: RelRef * kind: RelationKind * right: RelRef
                                                    // C1 supports C2 / A entails "the streets flood"
        | RelationMap                               // map — draw all asserted relations as a graph

    /// A whole document is simply an ordered list of statements.
    type Document = Statement list
