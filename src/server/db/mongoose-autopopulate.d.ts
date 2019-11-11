declare module 'mongoose-autopopulate' 
{
	import { Schema } from 'mongoose';
	export default function autopopulate(schema: Schema): void;
}