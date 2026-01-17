export interface ProductionLineType {
    id: number;
    name: string;
}

export interface ItemType {
    id: number;
    productionLine: ProductionLineType;
    code: string;
    description1: string;
    description2: string;
    unitOfMeasure: string;
    identifier: string;
}