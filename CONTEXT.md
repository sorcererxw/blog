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
_Avoid_: Feed item type, content source size

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

**Media Intrinsic Size**:
The original or preview media width and height carried with a **Feed Media Preview**.
_Avoid_: Card height, layout size

**Presentation Intent**:
An author-owned signal that a **Feed Item** should receive special presentation treatment.
_Avoid_: Source size, module size override

**Layout Estimate**:
The presentation-layer size estimate used to place a **Feed Module** in the masonry layout.
_Avoid_: Source-provided height, feed item size

**Measured Text**:
The variable **Feed Module** text content measured by the **Feed Layout Engine**.
_Avoid_: DOM height, source text size

**Feed Layout Engine**:
The browser-side presentation layer that calculates **Layout Estimates** and assigns **Feed Modules** to masonry columns.
_Avoid_: Content source layout, server feed merge

**Overview Feed Fallback Layout**:
The server-rendered single-column ordering used before the **Feed Layout Engine** hydrates.
_Avoid_: Server masonry estimate, duplicate layout engine

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
- A **Feed Media Preview** can carry **Media Intrinsic Size**
- **Media Intrinsic Size** is source metadata, not a **Layout Estimate**
- A **Feed Module** can have one **Module Size**: compact, standard, or feature
- **Module Size** changes visual weight, not **Feed Item** type
- **Module Size** belongs to feed presentation, not **Content Source** normalization
- A **Feed Item** can carry **Presentation Intent**
- Feature presentation is driven by **Presentation Intent**, not by source-owned size calculation
- **Presentation Intent** is the only v1 **Feed Item** display hint
- The **Feed Item** model should not keep a deprecated source-owned module size field
- A **Layout Estimate** is calculated in one feed presentation layer
- **Measured Text** includes title, summary or rich text, and other variable visible text that can wrap
- Fixed **Feed Module** chrome contributes constants to the **Layout Estimate**
- **Content Sources** provide normalized **Feed Item** data, not **Layout Estimates**
- The **Feed Layout Engine** owns **Layout Estimates** for the hydrated **Overview Feed**
- The server-rendered **Overview Feed** should not depend on browser text measurement
- The **Feed Layout Engine** recalculates **Layout Estimates** when the feed container width changes
- Text preparation can be cached separately from width-dependent text layout
- The **Overview Feed Fallback Layout** preserves **Overview Feed Index** order in one column
- Hydrated tablet and desktop views can replace the **Overview Feed Fallback Layout** with masonry columns
- Mobile views can keep the **Overview Feed Fallback Layout** after hydration
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
