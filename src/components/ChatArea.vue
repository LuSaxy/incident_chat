<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { Send, Loader2, PanelLeft, PanelLeftClose } from 'lucide-vue-next';
import type { Session } from '../types';
import MessageBubble from './MessageBubble.vue';
import GameOverlay from './game/GameOverlay.vue';

const props = defineProps<{
  session: Session | null;
  isLoading: boolean;
  isTyping: boolean;
  isSidebarOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'sendMessage', content: string): void;
  (e: 'toggleSidebar'): void;
}>();

const input = ref('');
const messagesEndRef = ref<HTMLDivElement | null>(null);
const showGame = ref(false);

const scrollToBottom = async () => {
    await nextTick();
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
};

watch(() => props.session?.messages, scrollToBottom, { deep: true });
watch(() => props.isTyping, scrollToBottom);

const handleSubmit = () => {
    if (!input.value.trim() || props.isLoading) return;
    
    emit('sendMessage', input.value);
    input.value = '';
    // Reset height
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = 'auto';
};

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
};

const autoResize = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
};
</script>

<template>
  <GameOverlay v-if="showGame" @close="showGame = false" />

  <div v-if="!session" class="flex-1 flex items-center justify-center bg-slate-900 flex-col text-slate-400 relative overflow-hidden">
    <!-- Retro Grid Background -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] z-0 bg-[length:100%_4px,6px_100%] pointer-events-none"></div>
    <div class="absolute inset-0 bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.1))] bg-[size:40px_40px]"></div>
    
    <div class="relative z-10 flex flex-col items-center animate-fade-in-up">
      <!-- Toggle for empty state too -->
      <button 
           @click="emit('toggleSidebar')"
           class="absolute top-4 left-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-50 md:hidden"
           title="Toggle Sidebar"
         >
            <PanelLeft v-if="!props.isSidebarOpen" :size="20" />
            <PanelLeftClose v-else :size="20" />
      </button>

      <div class="relative group cursor-pointer" @click="showGame = true">
        <!-- Glow effect -->
        <div class="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <img 
          src="/incident-strike.png" 
          alt="FinOps Bro: Incident Strike" 
          class="w-96 md:w-[32rem] rounded-xl shadow-2xl border-4 border-slate-800 transform transition-transform duration-500 hover:scale-[1.02] hover:rotate-1" 
        />
        
        <!-- Scanline overlay on image -->
        <div class="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20"></div>
        
        <!-- Play Button Overlay -->
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div class="bg-black/50 backdrop-blur-sm p-4 rounded-full border-2 border-white/20">
                 <span class="font-mono text-white text-xl font-bold tracking-widest">PLAY NOW</span>
             </div>
        </div>
      </div>
      
      <div class="mt-12 text-center">
        <button @click="showGame = true" class="text-orange-500 font-bold tracking-[0.2em] text-sm mb-4 animate-pulse hover:text-orange-400 transition-colors">
            PRESS START TO BEGIN
        </button>
        <p class="text-xs text-slate-600 font-mono">v1.0.0 • SYSTEM READY</p>
      </div>
    </div>
  </div>

  <div v-else class="flex-1 flex flex-col bg-[#F8FAFC] h-full relative font-sans">
    
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-md border-b border-slate-200/60 p-4 shadow-sm z-10 flex justify-between items-center sticky top-0">
      <div class="flex items-center gap-3">
         <button 
           @click="emit('toggleSidebar')"
           class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors md:hidden"
           title="Toggle Sidebar"
         >
            <PanelLeft v-if="!props.isSidebarOpen" :size="20" />
            <PanelLeftClose v-else :size="20" />
         </button>

         <div class="h-2 w-2 rounded-full" :class="session.isEphemeral ? 'bg-orange-400' : 'bg-green-500'"></div>
         <div>
             <h2 class="font-bold text-slate-800 text-sm flex items-center gap-2">
              {{ session.title }}
             </h2>
             <p class="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
               {{ session.isEphemeral ? 'Guest Session' : 'Incident Channel' }}
             </p>
         </div>
      </div>
      <!-- Right Side Actions (Future proofing) -->
      <div v-if="isLoading" class="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full animate-pulse">
        <Loader2 :size="12" class="animate-spin" />
        <span>Processing...</span>
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-12 space-y-2 scroll-smooth">
      <div class="max-w-4xl mx-auto w-full">
        <MessageBubble v-for="msg in session.messages" :key="msg.id" :message="msg" />
        
        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex w-full mb-8 animate-fade-in-up">
           <div class="mr-4 flex flex-col items-center">
               <div class="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-indigo-600">
                   <Loader2 :size="16" class="animate-spin" />
               </div>
           </div>
           <div class="p-4 rounded-2xl rounded-tl-sm bg-white border border-gray-100/50 shadow-sm flex items-center">
             <div class="flex space-x-1.5 grayscale opacity-50">
               <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
               <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
               <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
             </div>
           </div>
         </div>
        <div ref="messagesEndRef" class="h-4"></div>
      </div>
    </div>

    <!-- Floating Input Area -->
    <div class="p-4 md:p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
      <div class="max-w-4xl mx-auto relative group">
        <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition-opacity duration-300"></div>
        
        <div class="bg-white relative border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl flex items-end p-2 transition-all duration-300 focus-within:shadow-xl focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-500/5">
            <textarea
              v-model="input"
              @keydown="handleKeyDown"
              @input="autoResize"
              placeholder="Ask anything..."
              class="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-4 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
              rows="1"
            ></textarea>
            
            <button
              @click="handleSubmit"
              :disabled="!input.trim() || isLoading"
              class="mb-1 p-2.5 rounded-xl transition-all duration-200 flex-shrink-0"
              :class="!input.trim() || isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 active:scale-95'"
            >
              <Send :size="20" :class="{ 'opacity-50': isLoading }" />
            </button>
        </div>
        
        <div class="text-center mt-3 flex items-center justify-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
           <span class="text-[10px] text-slate-400 font-medium">
              Powered by FinOps Bro
           </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-grid-slate-200\/50 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(226 232 240 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
}
</style>
