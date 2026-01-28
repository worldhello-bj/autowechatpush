import React from 'react';
import Taro from '@tarojs/taro';
import { View, ScrollView } from '@tarojs/components';

interface EditorToolbarProps {
  editorCtx: Taro.EditorContext | null;
  onInsertImage: () => void;
}

export default function EditorToolbar({ editorCtx, onInsertImage }: EditorToolbarProps) {
  const handleFormat = (name: string, value?: string) => {
    if (!editorCtx) return;
    editorCtx.format(name, value);
  };

  const handleClear = () => {
    editorCtx?.removeFormat();
  };

  const handleUndo = () => {
    editorCtx?.undo();
  };

  const handleRedo = () => {
    editorCtx?.redo();
  };

  return (
    <View className="w-full bg-white border-t border-gray-200 p-2 shadow-sm">
      <ScrollView scrollX className="w-full" showScrollbar={false}>
        <View className="flex flex-row gap-3 items-center min-w-max px-1">
          {/* History */}
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors" 
            onClick={handleUndo}
          >
            ↩️
          </View>
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors" 
            onClick={handleRedo}
          >
            ↪️
          </View>
          
          <View className="w-[1px] h-5 bg-gray-300 mx-1"></View>

          {/* Formatting */}
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300" 
            onClick={() => handleFormat('header', 'H1')}
          >
            H1
          </View>
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300" 
            onClick={() => handleFormat('header', 'H2')}
          >
            H2
          </View>
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded font-bold hover:bg-gray-200 active:bg-gray-300" 
            onClick={() => handleFormat('bold')}
          >
            B
          </View>
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded italic hover:bg-gray-200 active:bg-gray-300" 
            onClick={() => handleFormat('italic')}
          >
            I
          </View>
          
          <View className="w-[1px] h-5 bg-gray-300 mx-1"></View>

          {/* Insert */}
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300" 
            onClick={onInsertImage}
          >
            🖼️
          </View>
          <View 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:bg-gray-300" 
            onClick={() => editorCtx?.insertDivider()}
          >
            ➖
          </View>
          
          <View className="w-[1px] h-5 bg-gray-300 mx-1"></View>

          {/* Utils */}
          <View 
            className="w-8 h-8 flex items-center justify-center bg-red-50 rounded hover:bg-red-100 active:bg-red-200" 
            onClick={handleClear}
          >
            🧹
          </View>
        </View>
      </ScrollView>
    </View>
  );
}