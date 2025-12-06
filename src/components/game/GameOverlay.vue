<script setup lang="ts">
import { ref } from 'vue';
import { X, Trophy, Play, RotateCcw } from 'lucide-vue-next';
import IncidentRunner from './IncidentRunner.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isPlaying = ref(false);
const showGameOver = ref(false);
const finalScore = ref(0);
const runnerRef = ref<InstanceType<typeof IncidentRunner> | null>(null);

const startGame = () => {
    isPlaying.value = true;
    showGameOver.value = false;
    finalScore.value = 0;
    if (runnerRef.value) runnerRef.value.resetGame();
};

const handleGameOver = (score: number) => {
    finalScore.value = score;
    showGameOver.value = true;
    isPlaying.value = false;
};

const close = () => {
    emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
    <!-- Game Container -->
    <div class="relative w-full max-w-4xl aspect-[2/1] bg-black rounded-lg shadow-2xl border-4 border-slate-700 overflow-hidden">
        
        <!-- Close Button -->
        <button 
           @click="close"
           class="absolute top-4 right-4 z-50 text-slate-500 hover:text-white bg-black/50 p-2 rounded-full"
        >
            <X :size="24" />
        </button>

        <!-- Main Menu -->
        <div v-if="!isPlaying && !showGameOver" class="absolute inset-0 flex flex-col items-center justify-center z-40 bg-slate-950 font-mono text-center">
            <h1 class="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-8 animate-pulse tracking-[0.2em]">
                INCIDENT<br>RUNNER
            </h1>
            
            <div class="space-y-4">
                <button 
                   @click="startGame"
                   class="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-none border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
                >
                    <Play :size="24" />
                    START MISSION
                </button>
                
                <div class="text-slate-400 text-sm mt-8">
                    <p class="mb-2">CONTROLS</p>
                    <div class="flex gap-4 justify-center">
                         <span class="border border-slate-700 px-2 py-1 rounded">SPACE / ▲</span>
                         <span>TO JUMP</span>
                    </div>
                    <div class="flex gap-4 justify-center mt-2">
                         <span class="border border-slate-700 px-2 py-1 rounded">ENTER / F</span>
                         <span>TO FIRE</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Game Over Screen -->
        <div v-if="showGameOver" class="absolute inset-0 flex flex-col items-center justify-center z-40 bg-slate-900/95 font-mono text-center animate-in fade-in zoom-in duration-300">
            <h2 class="text-3xl md:text-4xl font-black text-red-500 mb-4 tracking-widest max-w-2xl px-4">INCIDENT NOT SOLVED WITHIN SLA</h2>
            
            <div class="flex items-center gap-2 text-yellow-400 text-2xl mb-8">
                <Trophy :size="32" />
                <span>SCORE: {{ Math.floor(finalScore) }}</span>
            </div>
            
            <div class="flex gap-4">
                 <button 
                   @click="startGame"
                   class="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-none border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                >
                    <RotateCcw :size="20" />
                    RETRY
                </button>
                 <button 
                   @click="close"
                   class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-none border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all"
                >
                    EXIT
                </button>
            </div>
        </div>

        <!-- Game Canvas -->
        <IncidentRunner 
            ref="runnerRef"
            :active="isPlaying"
            @gameOver="handleGameOver"
        />
        
    </div>
  </div>
</template>
