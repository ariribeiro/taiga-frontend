/**
 * Contrato com a API (repositório taiga-dev-view-back, docs/API.md).
 * É uma CÓPIA dos tipos do back: ao mudar o contrato, atualize os dois lados.
 */

export type User = { userId: number; fullName: string; username: string; photo: string | null };

export type TProject = { id: number; name: string; slug: string; description?: string; logo_small_url?: string | null; logo_big_url?: string | null; is_backlog_activated?: boolean; is_kanban_activated?: boolean };
export type TMilestone = {
  id: number; name: string; slug: string;
  estimated_start: string; estimated_finish: string;
  closed: boolean; total_points: number | null; closed_points: number | null;
};
export type TStatsDay = { day: string; name: number | string; open_points: number | null; optimal_points: number | null };
export type TMilestoneStats = { days?: TStatsDay[] };

/** Configuração entregue pela API junto com os dados (links para o Taiga e textos de ajuda). */
export type Meta = {
  webBase: string;              // site do Taiga ("" = links ocultos)
  roles: string[] | null;       // papéis exibidos como cards (null = todos)
  blockedPattern: string;
  paceTolerance: number;
  staleDays: number;
};

// ---- Sprint (Scrum) ----
export type DevStory = { id: number; ref: number; subject: string; status: string; color: string; closed: boolean; points: number; role: "responsável" | "via task"; blocked: string | null };
export type DevTask = { id: number; ref: number; subject: string; status: string; color: string; closed: boolean; storyRef: number | null; blocked: string | null };
export type DevView = {
  userId: number | null; name: string; photo: string | null; role: string;
  stories: DevStory[]; tasks: DevTask[];
  points: number; closedPoints: number;
  tasksDone: number; progress: number;
  basis: "pontos" | "tasks";
  open: number;
  blocked: { ref: number; subject: string; note: string }[];
};
export type UnassignedItem = { id: number; ref: number; subject: string; status: string; color: string; closed: boolean; points?: number; storyRef?: number | null };
export type Unassigned = { stories: UnassignedItem[]; tasks: UnassignedItem[] };
export type SprintOverview = {
  totalPoints: number; closedPoints: number;
  stories: number; storiesDone: number;
  tasks: number; tasksDone: number;
  progress: number; expectedProgress: number | null;
  daysLeft: number | null; totalDays: number | null;
  byStatus: { name: string; color: string; count: number }[];
  unassignedStories: number; unassignedTasks: number;
};
export type Pace = { state: "closed" | "ahead" | "late" | "ok"; diff: number };

export type SprintResponse =
  | { kind: "kanban"; project: TProject }
  | { kind: "scrum"; project: TProject; sorted: TMilestone[]; sprint: null; meta: Meta }
  | {
      kind: "scrum"; project: TProject; sorted: TMilestone[]; sprint: TMilestone;
      devs: DevView[]; overview: SprintOverview; unassigned: Unassigned; stats: TMilestoneStats | null; pace: Pace; meta: Meta;
    };

// ---- Kanban ----
export type StatusKind = "queue" | "wip" | "done" | "archived";
export type KStatus = { id: number; name: string; color: string; order: number; kind: StatusKind; wipLimit: number | null; count: number };
export type KItem = { id: number; ref: number; subject: string; status: string; color: string; days: number; stale: boolean; blocked: string | null; owners: string[] };
export type KDev = {
  userId: number; name: string; photo: string | null; role: string;
  wip: number; blocked: number; stale: number; done: number; wipPoints: number; donePoints: number; items: KItem[];
};
export type KanbanMetrics = {
  days: number; staleDays: number;
  wip: number; queue: number; blocked: number; stale: number; unassignedWip: number;
  doneInWindow: number | null; donePoints: number; leadMedian: number | null; leadP85: number | null;
  prevDone: number | null; windowIncomplete: boolean; hasPoints: boolean;
  throughput: { label: string; count: number }[];
  aging: KItem[]; blockedItems: KItem[]; devs: KDev[];
};
export type KanbanResponse = {
  project: TProject; days: number; board: KStatus[];
  doneTotal: number; fetched: number; ordered: boolean; partial: boolean;
  metrics: KanbanMetrics; meta: Meta;
};
export type ItemDetail = {
  kind: "us" | "task";
  id: number; ref: number; subject: string;
  status: { name: string; color: string } | null;
  closed: boolean;
  blocked: string | null; // motivo do bloqueio, se bloqueado
  assignees: { name: string; photo: string | null }[];
  owner: { name: string; photo: string | null } | null;
  points: number | null;
  dueDate: string | null;
  created: string | null; modified: string | null; finished: string | null;
  description: string;
  tags: { name: string; color: string | null }[];
  webUrl: string | null; // link para este item no Taiga (precisa de TAIGA_WEB_URL)
  parent: { ref: number; subject: string; webUrl: string | null } | null; // task -> story
  children: { ref: number; subject: string; status: string; color: string; closed: boolean; assignee: string | null; assigneePhoto: string | null; webUrl: string | null }[]; // story -> tasks
  baseUrl: string; // endereço do Taiga, para resolver URLs relativas de imagens
  attachments: { id: number; name: string; url: string; size: number; isImage: boolean; description: string }[];
  comments: { user: string; photo: string | null; date: string; text: string }[];
};
