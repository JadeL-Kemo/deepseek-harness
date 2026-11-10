import type {
  AssistantMessageNode, AssistantTiming, ConversationLocation, ConversationNode, ConversationPromptSnapshot,
  ConversationViewNode, MessageImagesOwnerProps, PartialAssistant, RequestPromptChange,
  RequestView, RunningToolCall, SystemPromptNode, ToolCallBlock,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'

/** Request-header facts retained by the Trajectory target. */
export interface TrajectoryRequestHeaderState {
  readonly seq: number
  readonly time: number
  readonly prompt: ConversationPromptSnapshot
  readonly change?: RequestPromptChange
  readonly location: ConversationLocation
}

/** In-flight assistant output with the loaded Step start and first token timestamps. */
export interface TrajectoryPartialAssistant extends PartialAssistant {
  readonly timing?: Pick<AssistantTiming, 'stepStartTime' | 'firstTokenTime'>
}

/** One independently assembled contribution to the legacy Trajectory ledger. */
export type TrajectoryContribution =
  | { readonly kind: 'system-prompt'; readonly prompt: SystemPromptNode }
  | {
    readonly kind: 'node'
    readonly node: ConversationNode
  }
  | {
    readonly kind: 'assistant'
    readonly node?: AssistantMessageNode
    readonly partial: TrajectoryPartialAssistant | null
    readonly request?: Extract<RequestView, { purpose: 'assistant' }>
  }
  | {
    readonly kind: 'tool'
    readonly root: ToolCallBlock
  }
  | {
    readonly kind: 'request-header'
    readonly header: TrajectoryRequestHeaderState
  }
  | {
    readonly kind: 'compaction'
    readonly request: Extract<RequestView, { purpose: 'compaction' }>
  }
  | {
    readonly kind: 'session-end'
    readonly seq: number
    readonly time: number
  }
  | {
    readonly kind: 'turn-end'
    readonly turn: number
    readonly time: number
    readonly error?: string
    readonly errorCode?: string
  }

/** Target envelope consumed by the Trajectory snapshot builder. */
export interface TrajectoryConversationViewNode extends ConversationViewNode {
  readonly target: 'trajectory'
  readonly anchorSeq: number
  readonly location: ConversationLocation
  readonly data: TrajectoryContribution
}

/** Stage-oriented Trajectory data assembled from registered business Contexts. */
export interface TrajectorySnapshot {
  /** Complete loaded prompt text whose request header is outside the window. */
  readonly systemPrompts?: readonly SystemPromptNode[]
  readonly eventNodes: readonly ConversationNode[]
  readonly eventLocations: ReadonlyMap<number, ConversationLocation>
  readonly requests: readonly RequestView[]
  readonly callSchemas: ReadonlyMap<string, ConversationPromptSnapshot['tools'][number]>
  readonly partial: TrajectoryPartialAssistant | null
  readonly runningCalls: readonly RunningToolCall[]
}

/** Selector hook over the current Conversation binding's Trajectory target. */
export type UseTrajectory = SnapshotSelectorHook<TrajectorySnapshot>

/** Raw reasoning text and display facts offered to the expanded Trajectory reasoning Body Slot. */
export interface TrajectoryReasoningBodyOwnerProps {
  /** Complete or streaming assistant reasoning text. */
  readonly text: string
  /** Whether the reasoning tail is still streaming. */
  readonly running: boolean
  /** Whether the owner renders a folded inspector preview. */
  readonly preview: boolean
}

/** Session-independent reasoning Markdown with Trajectory labels and compact typography. */
export interface TrajectoryReasoningContentInput {
  /** Caller-selected Markdown. */
  readonly text: string
  /** Whether the supplied text is still streaming. */
  readonly running: boolean
  /** Whether the caller renders a folded inspector preview. */
  readonly preview?: boolean
  /** Localized Markdown controls, used unchanged when supplied; omission uses Trajectory's defaults. */
  readonly labels?: MarkdownLabels
}

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  interface ConversationViewSnapshotMap {
    /** Independently assembled data consumed by the Trajectory view. */
    trajectory: TrajectorySnapshot
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SessionStandardProps {
    /** Selector hook over the current Conversation binding's Trajectory target. */
    useTrajectory: UseTrajectory
  }

  interface SlotMap {
    /**
     * Renderer for one group of durable record images in the Trajectory
     * ledger. The owner supplies image references, an authorized loader, and
     * alignment. A registration replaces the shipped gallery; without one,
     * images are omitted.
     */
    'conversation.trajectory.images': { kind: 'single'; scope: 'session'; owner: MessageImagesOwnerProps }

    /**
     * Expanded assistant reasoning inside the Trajectory inspector. The owner
     * supplies the complete reasoning text and its display facts. A
     * registration replaces the shipped compact Markdown; it must still render
     * untranslated text on request.
     */
    'conversation.trajectory.reasoning.body': {
      kind: 'single'
      scope: 'session'
      owner: TrajectoryReasoningBodyOwnerProps
    }
  }

  interface SlotFactoryMap {
    /** Session-independent reasoning Markdown with Trajectory labels and compact typography. */
    'conversation.trajectory.reasoning.content': {
      scope: 'root'
      props: TrajectoryReasoningContentInput
      locale: 'trajectory'
    }
  }
}
