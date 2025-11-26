import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                    title="Italic"
                >
                    <em>I</em>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                    title="Bullet List"
                >
                    • List
                </button>
            </div>
            <div className="p-3 min-h-[150px] prose prose-sm max-w-none">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
