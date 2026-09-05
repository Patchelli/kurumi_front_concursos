export const simuladosTokens = {
  inputLabel: 'text-[8px] font-bold tracking-[0.06em] uppercase text-[#b0a0c8]',
  statDividerFinal: 'h-8 w-px shrink-0 bg-[#ede7f2]',
  action: 'inline-flex items-center gap-1 rounded-[9px] border-[1.5px] border-transparent px-2.5 text-[11px] font-bold whitespace-nowrap transition',
  /* Shell & layout */
  shell: 'jd-shell bg-[#f7f4f9]',
  main: 'min-w-0 flex min-h-0 flex-col gap-5 overflow-y-auto px-[clamp(22px,4vw,52px)] pb-[60px] pt-7 max-sm:px-4 max-sm:pb-[88px] max-sm:overflow-y-visible max-sm:gap-4',

  /* Header */
  header: 'flex flex-wrap items-start justify-between gap-5 max-sm:flex-col max-sm:gap-3',
  headerTitle: 'text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.04em] my-[5px_0_2px] text-[#1e1829]',
  headerSub: 'm-0 text-xs text-[#9080a8]',
  headerActions: 'flex items-center gap-3 max-sm:w-full max-sm:flex-col max-sm:items-stretch max-sm:gap-2',
  createButton: 'inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border-0 bg-[#66558f] px-3.5 text-xs font-bold text-white cursor-pointer transition-colors hover:bg-[#543c78] max-sm:justify-center',

  /* Stats strip */
  stats: 'flex flex-wrap items-center rounded-[18px] border border-[#e5dfe8] bg-white px-[22px] py-[14px] max-sm:grid max-sm:grid-cols-2 max-sm:gap-y-3 max-sm:gap-x-4 max-sm:px-4 max-sm:py-4',
  stat: 'flex min-w-[80px] flex-1 flex-col gap-px px-4 first:pl-0 max-sm:px-0 max-sm:min-w-0',
  statValue: 'text-[22px] font-black text-[#1e1829] leading-none max-sm:text-lg',
  statLabel: 'text-[9px] font-extrabold tracking-[0.08em] uppercase text-[#9080a8] max-sm:text-[8px]',
  statDivider: 'h-8 w-px shrink-0 bg-[#ede7f2] max-sm:hidden',

  /* Tabs */
  tabs: 'flex gap-1 p-1 bg-[#f3eef8] rounded-[14px] self-start',
  tab: 'flex items-center gap-[7px] h-9 px-4 border-0 rounded-[10px] bg-transparent text-[#9080a8] text-xs font-bold cursor-pointer transition-colors hover:bg-[#e8e0f0] hover:text-[#66558f]',
  tabActive: 'bg-white text-[#3d2b5a] shadow-[0_1px_4px_rgba(74,58,104,0.13)]',
  tabCount: 'inline-flex items-center justify-center min-w-5 h-[18px] px-[5px] rounded-full bg-[#e8e0f0] text-[#66558f] text-[10px] font-extrabold',
  tabCountActive: 'bg-[#ede7f9]',

  /* Badge */
  badge: 'inline-flex items-center h-5 px-2 rounded-full text-[9px] font-extrabold tracking-[0.05em] uppercase',
  badgeNeutral: 'bg-[#f0eaf6] text-[#66558f]',
  badgeSm: 'h-[18px] px-[7px] text-[8px]',

  /* Results list */
  results: 'flex flex-col gap-2.5',
  resultRow: 'grid grid-cols-[auto_1fr_auto] items-start gap-x-4 gap-y-3 rounded-[18px] border border-[#e5dfe8] bg-white px-[18px] py-[14px] transition-shadow hover:shadow-[0_4px_16px_rgba(61,43,90,0.08)] max-sm:grid-cols-[44px_1fr] max-sm:gap-x-3 max-sm:px-3.5 max-sm:py-3',
  resultActions: 'flex shrink-0 items-center gap-1.5 max-sm:col-span-full max-sm:justify-end max-sm:pt-2 max-sm:border-t max-sm:border-[#f0eaf6]',
  scoreRing: 'relative w-14 h-14 shrink-0 grid place-items-center mt-0.5 max-sm:w-[44px] max-sm:h-[44px]',
  scoreRingSvg: 'absolute inset-0 w-full h-full',
  scoreRingLabel: 'relative z-[1] text-xs font-black tracking-[-0.04em] max-sm:text-[10px]',
  resultBody: 'flex-1 min-w-0 flex flex-col gap-1',
  resultName: 'text-[13px] font-extrabold text-[#1e1829]',
  resultTags: 'flex flex-wrap items-center gap-1.5 text-[10px] text-[#9080a8] font-semibold max-sm:gap-1 max-sm:text-[9px]',
  resultSep: 'text-[#cfc2d8] text-[10px] max-sm:text-[9px]',
  resultDate: 'text-[10px] text-[#b0a0bc]',

  /* Action buttons */
  actionBtn: 'inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-[8px] text-[11px] font-bold cursor-pointer border border-transparent transition-colors whitespace-nowrap max-sm:h-7 max-sm:text-[10px] max-sm:px-2',
  actionGhost: 'border-[#d8cfe3] bg-white text-[#66558f] hover:bg-[#f3eef8] hover:border-[#b8a8d0]',
  actionIcon: 'border-[#d8cfe3] bg-white text-[#66558f] px-2 hover:bg-[#f3eef8] hover:border-[#b8a8d0]',
  actionDanger: 'border-[#e8c4cc] bg-white text-[#c0395a] px-2 hover:bg-[#fce8ef] hover:border-[#dda8b4]',

  /* Materia breakdown — name above bar on mobile */
  materiaBreakdown: 'col-span-full flex flex-col gap-2 border-t border-[#f0eaf6] pt-3',
  materiaDetailBlock: 'flex flex-col gap-[5px] [&+&]:pt-2 [&+&]:border-t [&+&]:border-[#f5f0f9]',
  materiaRow: 'grid grid-cols-[160px_1fr_38px_80px] items-center gap-2.5 max-sm:grid-cols-[1fr_auto] max-sm:grid-rows-[auto_auto] max-sm:gap-x-2 max-sm:gap-y-1',
  materiaName: 'text-[11px] font-bold text-[#3d2b5a] whitespace-nowrap overflow-hidden text-ellipsis max-sm:text-xs',
  materiaBarWrap: 'h-1.5 bg-[#f0eaf6] rounded-full overflow-hidden max-sm:col-[1] max-sm:row-[2]',
  materiaBar: 'h-full rounded-full transition-[width_0.3s]',
  materiaPct: 'text-[11px] font-extrabold text-right max-sm:col-[2] max-sm:row-[2] max-sm:min-w-[36px]',
  materiaDetail: 'text-[10px] text-[#9080a8] text-right max-sm:col-[2] max-sm:row-[1]',
  motivosChips: 'flex flex-wrap gap-1 pl-[170px] max-sm:pl-0',
  motivoChip: 'inline-flex items-center gap-[3px] h-5 px-2 rounded-full bg-[#f0eaf6] text-[9px] font-semibold text-[#66558f]',
  motivoChipStrong: 'font-black',
  motivoChipWarn: 'bg-[#fce8ef] text-[#9c2843]',
  materiaObs: 'mt-0.5 ml-[170px] text-[11px] text-[#8070a0] italic leading-[1.4] max-sm:ml-0',

  /* Redo btn */
  redoBtn: 'inline-flex items-center gap-1.5 h-[34px] px-3.5 border border-[#d8cfe3] rounded-[10px] bg-white text-[#66558f] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition-colors hover:bg-[#f3eef8] hover:border-[#b8a8d0]',

  /* Empty state */
  empty: 'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center bg-white border border-[#e5dfe8] rounded-[20px] max-sm:py-10 max-sm:px-5',
  emptyIcon: 'w-[72px] h-[72px] rounded-full bg-[#f4eefa] grid place-items-center text-[#c0aad8]',
  emptyTitle: 'text-base font-extrabold text-[#1e1829]',
  emptyText: 'text-[13px] text-[#9080a8] m-0 max-w-[280px] leading-[1.5]',
  emptyButton: 'inline-flex items-center gap-1.5 h-[34px] px-3.5 border-0 rounded-[10px] bg-[#66558f] text-white text-xs font-bold cursor-pointer mt-1 transition-colors hover:bg-[#543c78]',

  /* Overlay & Dialog */
  overlay: 'fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(30,24,41,0.48)] p-4 animate-[sp-wz-in_0.18s_ease-out] max-sm:p-0 max-sm:items-end',
  dialog: 'flex max-h-[92vh] w-[min(600px,calc(100%-32px))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(30,24,41,0.25)] animate-[sp-wz-in_0.2s_ease-out] max-sm:w-full max-sm:max-h-[96vh] max-sm:rounded-b-none',
  dialogHeader: 'flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#ede7f2] shrink-0 max-sm:px-4 max-sm:pt-4 max-sm:pb-3',
  dialogEyebrow: 'text-[9px] font-extrabold tracking-[0.1em] uppercase text-[#9472c8]',
  dialogTitle: 'text-[19px] font-extrabold text-[#1e1829] mt-1 max-sm:text-[17px]',
  dialogClose: 'w-8 h-8 border-0 rounded-[10px] bg-[#f3eef8] text-[#66558f] cursor-pointer shrink-0 grid place-items-center transition-colors hover:bg-[#e8e0f0]',
  dialogFooter: 'flex items-center justify-end gap-2.5 px-6 py-[14px] border-t border-[#ede7f2] shrink-0 bg-white max-sm:px-4 max-sm:py-3',
  btnGhost: 'inline-flex items-center gap-1.5 h-[34px] px-3.5 border border-[#d8cfe3] rounded-[10px] bg-white text-[#66558f] text-xs font-bold cursor-pointer transition-colors hover:bg-[#f3eef8] hover:border-[#b8a8d0]',
  btnPrimary: 'inline-flex items-center gap-1.5 h-[34px] px-3.5 border-0 rounded-[10px] bg-[#66558f] text-white text-xs font-bold cursor-pointer transition-colors hover:bg-[#543c78]',

  /* Create form */
  createForm: 'flex flex-col gap-4 px-6 py-5 overflow-y-auto flex-1 min-h-0 max-sm:px-4 max-sm:py-4 max-sm:gap-3',
  formSection: 'flex flex-col gap-2.5',
  formSectionTitle: 'text-[9px] font-extrabold tracking-[0.1em] uppercase text-[#9472c8] pb-1 border-b border-[#f0eaf6]',

  /* Fields */
  field: 'flex flex-col gap-[5px] min-w-0',
  fieldLabel: 'text-[9px] font-extrabold tracking-[0.08em] uppercase text-[#9080a8] whitespace-nowrap overflow-hidden text-ellipsis',
  fieldLabelEm: 'font-semibold opacity-65 normal-case tracking-normal',
  fieldInput: 'h-10 border-[1.5px] border-[#e0d8ea] rounded-xl bg-[#faf7fc] text-[#1e1829] text-[13px] max-sm:text-base font-semibold px-[14px] outline-none transition-colors w-full box-border focus:border-[#9472c8] focus:bg-white',
  fieldInputReadonly: 'bg-[#f4f0f8] text-[#66558f] cursor-default',
  fieldRow: 'grid grid-cols-2 gap-3 max-sm:grid-cols-1',
  fieldRow3: 'grid grid-cols-3 gap-3 max-sm:grid-cols-1',
  noSpin: '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',

  /* Materia form blocks */
  mfList: 'flex flex-col gap-1.5',
  mfBlock: 'border-[1.5px] border-[#e8e0f0] rounded-[14px] overflow-hidden bg-[#fdfaff] transition-colors',
  mfBlockOpen: 'border-[#b8a2d8] bg-[#faf7fd]',
  mfHead: 'flex items-center gap-2 px-3 py-[9px] min-w-0 max-sm:flex-wrap max-sm:gap-2',
  mfTitle: 'text-xs font-bold text-[#3d2b5a] flex-1 min-w-0 max-sm:basis-full max-sm:text-[13px]',
  mfQuick: 'flex items-center gap-1.5 shrink-0 max-sm:flex-wrap max-sm:gap-1.5',
  mfInputWrap: 'flex flex-col items-center gap-0.5',
  mfInputLabel: 'text-[8px] font-bold tracking-[0.06em] uppercase text-[#b0a0c8] whitespace-nowrap',
  mfInput: 'w-[62px] min-w-[62px] max-w-[62px] h-8 border-[1.5px] border-[#e0d8ea] rounded-[9px] bg-white text-[#1e1829] text-[13px] max-sm:text-base font-bold text-center px-1.5 outline-none transition-colors box-border focus:border-[#9472c8] disabled:bg-[#f1edf5] disabled:text-[#b8aec3] disabled:cursor-not-allowed disabled:border-[#e8e1ed] placeholder:text-[#ccc0dc] placeholder:font-normal placeholder:text-[11px] max-sm:w-14 max-sm:min-w-14 max-sm:max-w-14 max-sm:h-[30px]',
  mfErros: 'text-[11px] font-extrabold text-[#9c2843] bg-[#fce8ef] rounded-full py-0.5 px-2 whitespace-nowrap shrink-0',
  mfToggle: 'h-7 px-3 border border-[#d8cfe3] rounded-lg bg-white text-[#66558f] text-[10px] font-bold cursor-pointer shrink-0 transition-colors whitespace-nowrap hover:bg-[#f3eef8] hover:border-[#b8a8d0] max-sm:h-[26px] max-sm:px-2.5 max-sm:text-[9px]',
  mfToggleOpen: 'bg-[#f0eafa] border-[#b8a0d0]',
  mfTotalHint: 'block my-1 text-[#75648e] text-[11px] font-bold',
  mfDetail: 'flex flex-col gap-3 px-3 py-3 border-t border-[#ede7f6]',
  mfRow: 'flex gap-2.5',
  fieldSm: 'flex-[0_0_110px] min-w-0',
  fieldSmInput: 'h-9',

  /* Motivos */
  mfMotivosHeader: 'flex items-center justify-between gap-2 text-[9px] font-extrabold tracking-[0.08em] uppercase text-[#9080a8]',
  mfDistBadge: 'text-[9px] font-bold tracking-normal normal-case py-0.5 px-2 rounded-full bg-[#f0eaf6] text-[#9080a8] whitespace-nowrap',
  mfDistBadgeOk: 'bg-[#e8f7f3] text-[#1a7a62]',
  mfMotivos: 'grid grid-cols-2 gap-[5px] max-sm:grid-cols-1',
  mfMotivoRow: 'flex items-center gap-2 py-1.5 px-2.5 rounded-[9px] bg-white border border-[#ede7f2] min-w-0',
  mfMotivoLabel: 'text-[11px] font-semibold text-[#3d2b5a] flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis max-sm:text-[10px]',
  mfMotivoInput: 'w-[46px] h-7 shrink-0 border-[1.5px] border-[#e0d8ea] rounded-[7px] bg-[#faf7fc] text-[#1e1829] text-xs max-sm:text-base font-bold text-center p-0 outline-none transition-colors box-border focus:border-[#9472c8]',

  /* Obs textarea */
  obs: 'w-full min-h-16 resize-y border-[1.5px] border-[#e0d8ea] rounded-[10px] bg-[#faf7fc] text-[#1e1829] text-xs max-sm:text-base font-medium leading-[1.5] py-2 px-3 outline-none transition-colors font-[inherit] box-border focus:border-[#9472c8] focus:bg-white',
  obsCount: 'text-[9px] text-[#b0a0bc] text-right mt-px',
} as const;
