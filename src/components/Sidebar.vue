<script setup lang="ts">
import { ref, computed } from 'vue';
import { MessageSquarePlus, Sparkles, ChevronLeft } from 'lucide-vue-next';
import type { Session } from '../types';
import { cn } from '../lib/utils';
import { getGroupLabel } from '../lib/dateUtils';

const props = defineProps<{
  sessions: Session[];
  currentSessionId: string | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'switchSession', id: string): void;
  (e: 'createSession', id?: string): void;
  (e: 'toggleSidebar'): void;
}>();

const showNewChatInput = ref(false);
const incidentInput = ref('');

const handleNewChat = () => {
  const id = incidentInput.value.trim() || undefined;
  emit('createSession', id);
  incidentInput.value = '';
  showNewChatInput.value = false;
};

// Group sessions by date
const groupedSessions = computed(() => {
    const groups: Record<string, Session[]> = {};
    
    // Sort logic is already handled in storage, but let's be safe
    const sorted = [...props.sessions].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    for (const session of sorted) {
        const label = getGroupLabel(session.updatedAt);
        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(session);
    }
    
    // Enforce order
    const orderedGroups: { label: string; sessions: Session[] }[] = [];
    const order = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];
    
    for (const label of order) {
        if (groups[label]) {
            orderedGroups.push({ label, sessions: groups[label] });
        }
    }
    
    return orderedGroups;
});
</script>

<template>
  <div 
    class="flex flex-col h-full bg-slate-950 border-r border-white/5 transition-all duration-300 ease-in-out z-30 flex-shrink-0 fixed inset-y-0 left-0 md:relative"
    :class="[
       isOpen ? 'translate-x-0 w-72 md:w-72' : '-translate-x-full w-72 md:w-0 md:translate-x-0 md:opacity-0 md:overflow-hidden'
    ]"
  >
    <!-- Sidebar Content (Wrapped to handle width transition cleanly) -->
    <div class="flex flex-col h-full w-72 min-w-[18rem]">
        <!-- Header -->
        <div class="px-3 pt-3 pb-2 flex-shrink-0">
            <div class="flex items-center justify-between mb-2 md:hidden">
                <h1 class="text-lg font-bold text-white tracking-tight">
                  FinOps <span class="text-blue-400">Bro</span>
                </h1>
                <button @click="emit('toggleSidebar')" class="text-slate-400 hover:text-white">
                    <ChevronLeft :size="20" />
                </button>
            </div>

            <!-- New Chat Button -->
            <div v-if="!showNewChatInput" class="mb-4">
                 <button
                    @click="showNewChatInput = true" 
                    class="group w-full flex items-center justify-between bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-200 py-2.5 px-3 rounded-xl transition-all duration-200"
                >
                    <div class="flex items-center gap-2">
                         <div class="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Sparkles :size="14" />
                        </div>
                        <span class="text-sm font-medium">New Chat</span>
                    </div>
                    <MessageSquarePlus :size="16" class="opacity-50 group-hover:opacity-100" />
                </button>
            </div>
            
            <div v-else class="bg-slate-900 border border-blue-500/30 p-3 rounded-xl animate-fade-in-up mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold text-blue-400 uppercase">Input Incident ID</span>
                    <button @click="showNewChatInput = false" class="text-[10px] text-slate-500 hover:text-slate-300">Close</button>
                </div>
                <input
                    type="text"
                    placeholder="e.g. INC-12345"
                    v-model="incidentInput"
                    class="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none mb-2"
                    autofocus
                    @keydown.enter="handleNewChat"
                    @keydown.esc="showNewChatInput = false"
                />
                <button
                    @click="handleNewChat"
                    class="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                    Start Session
                </button>
            </div>
        </div>

        <!-- Scrollable History -->
        <div class="flex-1 overflow-y-auto px-3 pb-4 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-700">
             <div v-if="sessions.length === 0" class="mt-8 text-center px-4">
                <p class="text-xs text-slate-500 mb-2">No previous chats.</p>
             </div>

             <div v-for="group in groupedSessions" :key="group.label">
                 <h3 class="px-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10 py-1">
                     {{ group.label }}
                 </h3>
                 <div class="space-y-1">
                     <button
                        v-for="session in group.sessions"
                        :key="session.id"
                        @click="emit('switchSession', session.id)"
                        :class="cn(
                          'w-full text-left px-2 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors relative group',
                          currentSessionId === session.id 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        )"
                      >
                         <div class="flex-1 truncate">
                             {{ session.title }}
                         </div>
                         <!-- Type Indicator -->
                         <div v-if="session.isEphemeral" class="w-1.5 h-1.5 rounded-full bg-orange-400/50" title="Guest Session"></div>
                         <div v-else class="w-1.5 h-1.5 rounded-full bg-green-500/50" title="Recorded Incident"></div>
                      </button>
                 </div>
             </div>
        </div>

        <!-- Footer / User Profile -->
        <div class="p-3 border-t border-white/5 bg-slate-950 z-20">
            <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer group">
                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white border border-white/5">
                    <span class="text-xs font-bold">BB</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-slate-300 group-hover:text-white truncate">Best Bro</div>
                    <div class="text-[10px] text-slate-500 truncate">FinOps Engineer</div>
                </div>
            </div>
        </div>
    </div>
  </div>
  
  <!-- Mobile Overlay -->
  <div 
     v-if="isOpen" 
     @click="emit('toggleSidebar')"
     class="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity"
  ></div>
</template>

<style scoped>
/* Custom scrollbar for sidebar specifically */
.scrollbar-thin::-webkit-scrollbar {
    width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}
</style>
