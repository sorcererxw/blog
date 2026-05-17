# Personal Site

This context describes the public personal site product. The site presents one authored public identity through writing, projects, and social posts.

## Language

**Personal Site**:
The public-facing home for the author as a person, combining writing, projects, and social posts.
_Avoid_: Blog2, public blog

**Overview Feed**:
The primary homepage stream that mixes authored public content types in one browsable surface.
_Avoid_: Homepage hero, blog archive

**Overview Feed Index**:
The app-owned normalized ordering of **Feed Items** read by the homepage.
_Avoid_: Live source merge

**Profile Hero**:
The opening personal introduction area for the **Personal Site**.
_Avoid_: Marketing hero

**Profile Source**:
The Notion-owned content source for the **Profile Hero**.
_Avoid_: Static config

**Profile Page**:
The single Notion page used as the **Profile Source**.
_Avoid_: Profile database

**Profile Content**:
The rendered Notion page content inside the **Profile Hero**.
_Avoid_: Whitelisted profile fields

**Hero Expansion**:
The interaction that reveals the full **Profile Content** when the default **Profile Hero** height is constrained.
_Avoid_: Profile detail page

**Content Source**:
An upstream system that contributes public content to the **Overview Feed**.
_Avoid_: CMS

**Feed Module**:
The unified presentation unit used to render a **Feed Item** in the **Overview Feed**.
_Avoid_: Type-specific card, source-specific component

**Module Size**:
The visual weight assigned to a **Feed Module** within the masonry layout.
_Avoid_: Feed item type

**Feed Filter**:
A view state that narrows which **Feed Items** are shown in the **Overview Feed**.
_Avoid_: Archive page, section page

**Filter Query**:
The URL query parameters that represent a **Feed Filter**.
_Avoid_: Client tab state

**Stack Inventory**:
A hidden inventory of tools or technologies associated with the author.
_Avoid_: Public section, feed item type

**Compatibility Route**:
A legacy public path retained only to preserve old links.
_Avoid_: Section page

**Feed Item**:
Any public unit that can appear in the **Overview Feed**.
_Avoid_: Card, tile

**Displayed Time**:
The timestamp used to position a **Feed Item** in the **Overview Feed**.
_Avoid_: Created time, updated time

**Source Published Time**:
The original publication timestamp from a **Content Source**.
_Avoid_: Displayed time

**Blog Entry**:
A long-form authored article that appears as one content type within the **Overview Feed**.
_Avoid_: Post

**Project**:
A public work, experiment, or shipped artifact that appears as one content type within the **Overview Feed**.
_Avoid_: Portfolio item

**Social Post**:
A short-form public update originally published on an external social platform and surfaced inside the **Overview Feed**.
_Avoid_: Thought

**Social Source**:
An external platform account or channel from which **Social Posts** are surfaced.
_Avoid_: Thought source

**Content Detail**:
A deep-linked full view for a feed item when the item needs more space than its **Overview Feed** card.
_Avoid_: Archive page

**External Target**:
The primary off-site destination for a **Feed Item**.
_Avoid_: Link, URL

**Feed Media Preview**:
The lightweight media representation shown inside a **Feed Module**.
_Avoid_: Full media embed

## Relationships

- A **Personal Site** has exactly one **Overview Feed**
- A **Personal Site** has one **Profile Hero** before the **Overview Feed**
- A **Profile Hero** is owned by exactly one **Profile Source**
- A **Profile Source** is one **Profile Page**, not a database of profile records
- A **Profile Hero** renders the full **Profile Content** from its **Profile Page**
- A **Profile Hero** can constrain visible **Profile Content** by default
- **Hero Expansion** reveals the full **Profile Content** on the same page
- **Hero Expansion** should work with native HTML/CSS before introducing client-side hydration
- The **Profile Hero** targets a one hour freshness window
- An **Overview Feed** reads from one **Overview Feed Index**
- The **Overview Feed Index** targets a ten minute freshness window
- The **Overview Feed Index** should preserve the last successful result when a **Content Source** refresh fails
- An **Overview Feed** contains zero or more **Feed Items**
- An **Overview Feed** renders all matching **Feed Items** in one server-rendered response
- An **Overview Feed** is assembled from one or more **Content Sources**
- A **Content Source** contributes normalized **Feed Items**, but does not define the **Overview Feed** structure
- A **Feed Item** is rendered through a **Feed Module**
- **Feed Modules** share one presentation system across item types and sources
- A **Feed Module** can include a **Feed Media Preview**
- **Feed Media Preview** is lightweight and should not embed full external media players
- A **Feed Module** has one **Module Size**: compact, standard, or feature
- **Module Size** changes visual weight, not **Feed Item** type
- **Module Size** can be provided by a **Content Source** as an explicit override
- Missing or invalid **Module Size** falls back to the item type default
- The feature **Module Size** is manual-only and must not be inferred automatically
- A **Feed Filter** changes the visible subset of the **Overview Feed** without creating a separate public page
- A **Feed Filter** is represented by a server-rendered **Filter Query**
- **Filter Query** can filter by item type or **Social Source**
- **Stack Inventory** remains hidden from the primary **Personal Site** structure
- **Stack Inventory** is not a **Feed Item** type
- A **Compatibility Route** can redirect to the **Overview Feed** with a **Feed Filter**
- Public archive pages are **Compatibility Routes**, not primary **Personal Site** structure
- Different **Content Sources** can use different ingestion paths before normalization
- A **Blog Entry**, **Project**, or **Social Post** is a **Feed Item** when it is publicly surfaced
- A **Blog Entry** can have a **Content Detail**
- A **Project** can have an **External Target**, a **Content Detail**, both, or neither
- A **Project** with an **External Target** uses that target as its primary destination
- A **Project** with both an **External Target** and **Content Detail** treats the **Content Detail** as secondary context
- A **Social Post** belongs to exactly one **Social Source**
- A **Social Post** uses its original platform post as its primary **External Target**
- The **Personal Site** surfaces **Social Posts** as summaries, not full copied social archives
- A **Feed Item** can have both a **Displayed Time** and a **Source Published Time**
- **Displayed Time** controls Overview Feed sorting
- **Source Published Time** preserves the upstream publication timestamp
- If **Displayed Time** is missing, **Source Published Time** can be used for sorting
- A **Feed Item** with a **Displayed Time** appears before items without a **Displayed Time**
- **Feed Items** with a **Displayed Time** are ordered newest first
- **Feed Items** without either time appear at the bottom of the **Overview Feed**

## Example dialogue

> **Dev:** "Should the homepage introduce the blog first?"
> **Domain expert:** "No. The homepage is the **Overview Feed** for the **Personal Site**. A **Blog Entry** is only one kind of item in that feed."

## Flagged ambiguities

- "blog" previously named the whole product; resolved: the product is the **Personal Site**, and **Blog Entry** is only one content type.
- "post" can mean either a long-form article or a short social update; resolved: use **Blog Entry** for long-form articles and **Social Post** for external short-form updates.
- "only one page" means one primary public entry surface, not a ban on deep-linked **Content Detail** pages.
- "thought" was an implementation/page term for Telegram-derived content; resolved: use **Social Post** for the surfaced public item and **Social Source** for the external origin.
