import classNames from '@/utils/classNames'
import ToolButtonBold from './toolButtons/ToolButtonBold'
import ToolButtonItalic from './toolButtons/ToolButtonItalic'
import ToolButtonStrike from './toolButtons/ToolButtonStrike'
import ToolButtonCode from './toolButtons/ToolButtonCode'
import ToolButtonOrderedList from './toolButtons/ToolButtonOrderedList'
import ToolButtonCodeBlock from './toolButtons/ToolButtonCodeBlock'
import ToolButtonBlockquote from './toolButtons/ToolButtonBlockquote'
import ToolButtonHorizontalRule from './toolButtons/ToolButtonHorizontalRule'
import ToolButtonHeading from './toolButtons/ToolButtonHeading'
import ToolButtonParagraph from './toolButtons/ToolButtonParagraph'
import ToolButtonUndo from './toolButtons/ToolButtonUndo'
import ToolButtonRedo from './toolButtons/ToolButtonRedo'
import ToolButtonBulletList from './toolButtons/ToolButtonBulletList'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { Editor, EditorContentProps, JSONContent } from '@tiptap/react'
import type { ReactNode, JSX, Ref } from 'react'
import type { BaseToolButtonProps, HeadingLevel } from './toolButtons/types'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export type RichTextEditorRef = HTMLDivElement

type RichTextEditorProps = {
    content?: string
    invalid?: boolean
    customToolBar?: (
        editor: Editor,
        components: {
            ToolButtonBold: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonItalic: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonStrike: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonCode: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonBlockquote: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonHeading: ({
                editor,
            }: BaseToolButtonProps & {
                headingLevel?: HeadingLevel[]
            }) => JSX.Element
            ToolButtonBulletList: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonOrderedList: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonCodeBlock: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonHorizontalRule: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonParagraph: ({
                editor,
            }: BaseToolButtonProps) => JSX.Element
            ToolButtonUndo: ({ editor }: BaseToolButtonProps) => JSX.Element
            ToolButtonRedo: ({ editor }: BaseToolButtonProps) => JSX.Element
        },
    ) => ReactNode
    onChange?: (content: {
        text: string
        html: string
        json: JSONContent
    }) => void
    editorContentClass?: string
    customEditor?: Editor | null
    ref?: Ref<RichTextEditorRef>
} & Omit<EditorContentProps, 'editor' | 'ref' | 'onChange'>

/**
 * Custom Tiptap extension to manage whitespace.
 * - `transformPastedText`: Cleans up pasted content.
 * - `handleTextInput`: Prevents leading spaces on new lines and double spaces.
 */
const Whitespace = Extension.create({
    name: 'whitespace',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('whitespace'),
                props: {
                    // 1. Handle pasted content
                    transformPastedText(text) {
                        return text.replace(/\s+/g, ' ').trim()
                    },
                    // 2. Handle direct user input
                    handleTextInput(view, from, to, text) {
                        // Only apply logic when the user is typing a space
                        if (text === ' ') {
                            const { state } = view
                            const { $from } = state.selection

                            // Condition 1: Prevent leading space at the start of a new block.
                            // `$from.parentOffset` is 0 if the cursor is at the very beginning of the parent node (e.g., a paragraph).
                            if ($from.parentOffset === 0) {
                                return true // Prevents the space
                            }

                            // Condition 2: Prevent double spaces.
                            // Check the character immediately before the cursor's position.
                            const charBefore = state.doc.textBetween(from - 1, from)
                            if (charBefore === ' ') {
                                return true // Prevents the second space
                            }
                        }

                        // For any other character or valid spaces, allow the default behavior.
                        return false
                    },
                },
            }),
        ]
    },
})


const RichTextEditor = (props: RichTextEditorProps) => {
    const {
        content = '',
        customToolBar,
        invalid,
        onChange,
        editorContentClass,
        customEditor,
        ref,
        ...rest
    } = props

    const editor = customEditor
        ? customEditor
        : useEditor({
              extensions: [
                  StarterKit.configure({
                      bulletList: {
                          keepMarks: true,
                      },
                      orderedList: {
                          keepMarks: true,
                      },
                  }),
                  Whitespace,
              ],
              editorProps: {
                  attributes: {
                      class: 'm-2! focus:outline-hidden',
                  },
              },
              content,
              onUpdate({ editor }) {
                  onChange?.({
                      text: editor.getText(),
                      html: editor.getHTML(),
                      json: editor.getJSON(),
                  })
              },
          })

    if (!editor) return null

    return (
        <div
            className={classNames(
                'rich-text-editor rounded-xl ring-1 ring-gray-200 dark:ring-gray-600 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 pt-3',
                editor.isFocused && 'ring-primary border-primary',
                invalid && 'bg-error-subtle',
                editor.isFocused &&
                    invalid &&
                    'bg-error-subtle ring-error border-error',
            )}
        >
            <div className="flex gap-x-1 gap-y-2 px-2">
                {customToolBar ? (
                    customToolBar(editor, {
                        ToolButtonBold,
                        ToolButtonItalic,
                        ToolButtonStrike,
                        ToolButtonCode,
                        ToolButtonBlockquote,
                        ToolButtonHeading,
                        ToolButtonBulletList,
                        ToolButtonOrderedList,
                        ToolButtonCodeBlock,
                        ToolButtonHorizontalRule,
                        ToolButtonParagraph,
                        ToolButtonUndo,
                        ToolButtonRedo,
                    })
                ) : (
                    <>
                        <ToolButtonBold editor={editor} />
                        <ToolButtonItalic editor={editor} />
                        <ToolButtonStrike editor={editor} />
                        <ToolButtonCode editor={editor} />
                        <ToolButtonBlockquote editor={editor} />
                        <ToolButtonHeading editor={editor} />
                        <ToolButtonBulletList editor={editor} />
                        <ToolButtonOrderedList editor={editor} />
                        <ToolButtonCodeBlock editor={editor} />
                        <ToolButtonHorizontalRule editor={editor} />
                    </>
                )}
            </div>

            <EditorContent
                ref={ref}
                className={classNames(
                    'max-h-[600px] overflow-auto px-2 prose prose-p:text-sm dark:prose-p:text-gray-400 max-w-full',
                    editorContentClass,
                )}
                editor={editor}
                {...rest}
            />
        </div>
    )
}

export default RichTextEditor