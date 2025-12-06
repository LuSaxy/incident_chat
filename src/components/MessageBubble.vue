<script setup lang="ts">
import { computed } from 'vue';
import { User, Bot } from 'lucide-vue-next';
import MarkdownIt from 'markdown-it';
import type { Message } from '../types';
import { cn } from '../lib/utils';

const props = defineProps<{
  message: Message;
}>();

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
});

const isUser = computed(() => props.message.sender === 'user');
const renderMarkdown = (content: string) => md.render(content);
const formattedTime = computed(() => {
  return new Date(props.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});
</script>

<template>
  <div :class="cn(
    'flex w-full mb-8 animate-fade-in-up group',
    isUser ? 'justify-end' : 'justify-start'
  )">
    <!-- Avatar (Bot) -->
    <div v-if="!isUser" class="flex-shrink-0 mr-4 flex flex-col items-center">
        <div class="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-indigo-600">
            <Bot :size="18" />
        </div>
    </div>

    <div :class="cn(
      'flex max-w-[85%] md:max-w-[75%] flex-col',
      isUser ? 'items-end' : 'items-start'
    )">
      <!-- Name Tag -->
      <span class="text-[10px] text-gray-400 font-medium mb-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {{ isUser ? 'Best Bro' : 'FinOps Bro' }} • {{ formattedTime }}
      </span>

      <!-- Bubble -->
      <div :class="cn(
        'p-4 md:p-5 text-sm md:text-base leading-relaxed shadow-sm transition-all duration-200 hover:shadow-md',
        isUser 
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-blue-500/10' 
          : 'bg-white border border-gray-100/50 text-gray-800 rounded-2xl rounded-tl-sm shadow-gray-200/50'
      )">
        <p v-if="isUser" class="whitespace-pre-wrap">{{ message.content }}</p>
        <div v-else class="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline" v-html="renderMarkdown(message.content)"></div>
      </div>
      
    </div>

    <!-- Avatar (User) -->
    <div v-if="isUser" class="flex-shrink-0 ml-4 flex flex-col items-center">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg flex items-center justify-center text-white">
            <User :size="16" />
        </div>
    </div>
  </div>
</template>
