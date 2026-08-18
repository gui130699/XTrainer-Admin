import type { Timestamp } from "firebase/firestore";
export interface UserProfile { uid:string; name:string; email:string; role:"admin"|"user"; birthDate?:string; height?:number; sex?:string; goal?:string; photoURL?:string; createdAt?:Timestamp }
export interface Exercise { id:string; name:string; nameEn?:string; aliases?:string[]; muscleGroup:string; muscleSubgroup?:string; equipment?:string; videoUrl?:string; sortOrder?:number; description?:string; instructions?:string; notes?:string; active:boolean; createdAt?:Timestamp; updatedAt?:Timestamp }
export interface WorkoutExercise { id:string; exerciseId:string; name:string; order:number; sets:number; repsMin:number; repsMax:number; restSeconds:number; suggestedLoad?:number; notes?:string }
export interface Workout { id:string; ownerId:string; name:string; title:string; description?:string; muscleGroups:string[]; exercises:WorkoutExercise[]; active:boolean; createdAt?:Timestamp; updatedAt?:Timestamp }
export interface TrainingSet { id:string; load:number; reps:number; completed:boolean; volume:number }
export interface SessionExercise { id:string; exerciseId:string; name:string; order:number; target:WorkoutExercise; sets:TrainingSet[] }
export interface WorkoutSession { id:string; ownerId:string; workoutId:string; workoutName:string; startedAt?:Timestamp; endedAt?:Timestamp; durationSeconds?:number; exercises:SessionExercise[]; totalVolume:number; totalSets:number; status:"active"|"completed"|"cancelled"; notes?:string }
export interface BodyWeight { id:string; ownerId:string; date:string; weight:number; note?:string; createdAt?:Timestamp; updatedAt?:Timestamp }
export interface PhysicalAssessment { id:string; ownerId:string; date:string; type:"quick"|"complete"; weight?:number; height?:number; bodyFat?:number; leanMass?:number; measurements:Record<string,number|undefined>; notes?:string; photos?:Record<string,string>; createdAt?:Timestamp }
export interface SystemConfig { initialized:boolean; adminUid:string; updatedAt?:Timestamp }
export interface DefaultExercise { id:string; name:string; nameEn:string; aliases?:string[]; muscleGroup:string; videoUrl:string; active:boolean; sortOrder:number }
