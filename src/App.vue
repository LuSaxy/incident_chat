<script setup lang="ts">
import { ref } from 'vue';
import Sidebar from './components/Sidebar.vue';
import ChatArea from './components/ChatArea.vue';
import { useChat } from './composables/useChat';

const { 
  sessions, 
  currentSession, 
  isLoading, 
  isTyping,
  createSession, 
  switchSession, 
  sendMessage 
} = useChat();

const isSidebarOpen = ref(true);

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden font-sans">
    <Sidebar 
      :sessions="sessions"
      :currentSessionId="currentSession?.id || null"
      :isOpen="isSidebarOpen"
      @switchSession="switchSession"
      @createSession="createSession"
      @toggleSidebar="toggleSidebar"
    />
    <ChatArea 
      :session="currentSession"
      :isLoading="isLoading"
      :isTyping="isTyping"
      :isSidebarOpen="isSidebarOpen"
      @sendMessage="sendMessage"
      @toggleSidebar="toggleSidebar"
    />
  </div>
</template>
