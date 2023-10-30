export interface Entry {
    id?: string;
    type: '收入' | '支出';
    amount: number;
    description: string;
}