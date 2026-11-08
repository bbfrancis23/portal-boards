# How it works: in plain words

No code needed. This page explains what portal-boards is made of and what happens when you use it.

## 1. The big picture
The app has three parts, like a shop: a **shop window** you look at, a **clerk** who does the work, and a **filing cabinet** where everything is kept. You prove who you are with an account you already have (GitHub or Google), so the app never stores a password.

```mermaid
flowchart LR
    You["🧑 You<br/>in your web browser"]
    Window["🪟 The website<br/>what you see and click"]
    Clerk["🧠 The server<br/>checks who you are,<br/>saves and fetches your things"]
    Cabinet[("🗄️ The database<br/>where everything is kept")]
    ID["🪪 GitHub or Google<br/>vouches for who you are"]

    You --> Window
    Window <--> Clerk
    Clerk <--> Cabinet
    Clerk <-.->|"at log-in"| ID
```

## 2. How things fit together
Everything you make sits inside something bigger, like folders inside folders.

```mermaid
flowchart TD
    Account["👤 Your account"]
    Account --> P1["🏢 Portal: Atrium Spa and Wellness<br/>one per business"]
    Account --> P2["🏢 Portal: another business"]
    P1 --> B1["📋 Board: Overview"]
    P1 --> B2["📋 Board: Members"]
    P1 --> B3["📋 Board: Revenue"]
    B2 --> W1["🧩 Widget: Members table"]
    B2 --> W2["🧩 Widget: Membership mix chart"]
    W1 --> R1["📝 Row: Jane, Monthly unlimited"]
    W1 --> R2["📝 Row: Sam, 10-class pack"]
```

- A **portal** is everything about one business.
- A **board** is one page of that portal.
- A **widget** is one card on a board: a table, a number, or a chart.
- A **row** is one line of information you type into a table.

## 3. Templates are photocopies
When you start a new portal you can begin blank, or from a **template** made for your kind of business. The template is **photocopied** into your portal. After that the copy is yours: change anything you like, and the original stays the same.

```mermaid
flowchart LR
    T["📄 Wellness studio template<br/>(the original)"]
    T -->|"photocopy"| Mine["📁 Your portal<br/>boards and widgets ready to fill in"]
    T -->|"photocopy"| Theirs["📁 Someone else's portal"]
    Mine -->|"you edit"| Edited["✏️ Your changes<br/>only affect your copy"]
```

## 4. Tables feed the charts
You only type information into **tables**. The numbers and charts read from those tables and redraw themselves, so you never update a chart by hand.

```mermaid
flowchart LR
    Type["⌨️ You add a member<br/>to the Members table"] --> Table["📝 Members table"]
    Table --> Pie["🥧 Membership mix chart<br/>updates by itself"]
    Table --> Number["🔢 Active members<br/>updates by itself"]
```

## Coming later
- **Try it without an account:** a demo studio full of sample data, open for 24 hours.
- **An assistant on every board:** a helper with its own name and personality (studio manager, secretary, accountant) who can answer questions about your numbers.
