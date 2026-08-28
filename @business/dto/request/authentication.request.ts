export type LoginRequest={email:string;password:string}; export type RegisterRequest=LoginRequest&{personalData:{fullName:string}};
