import { MessageTemplate, UserRole } from './types';
import { Language } from './i18n';

/**
 * Translated message templates keyed by template ID and language
 */
const templateTranslations: Record<string, Record<Language, string>> = {
  // ── STATUS (Mechanic) ──────────────────────────────────────────
  'status-on-the-way': {
    en: "I'm on my way to start working on this job.",
    fr: "Je suis en route pour commencer ce travail.",
    ro: "Sunt pe drum să încep lucrul.",
    pt: "Estou a caminho para começar o serviço.",
    ru: "Я в пути, скоро начну работу.",
  },
  'status-started': {
    en: "I've started working on this job.",
    fr: "J'ai commencé le travail.",
    ro: "Am început lucrul.",
    pt: "Comecei o serviço.",
    ru: "Я начал работу.",
  },
  'status-almost-done': {
    en: "Almost finished! Just a few more minutes.",
    fr: "Presque terminé ! Encore quelques minutes.",
    ro: "Aproape gata! Mai sunt câteva minute.",
    pt: "Quase terminado! Só mais alguns minutos.",
    ru: "Почти готово! Ещё несколько минут.",
  },
  'status-ready-pickup': {
    en: "Job completed! Vehicle is ready for pickup.",
    fr: "Travail terminé ! Véhicule prêt à récupérer.",
    ro: "Job finalizat! Vehiculul e gata de ridicare.",
    pt: "Serviço concluído! Veículo pronto para recolha.",
    ru: "Работа завершена! Авто готово к выдаче.",
  },
  'status-paused': {
    en: "Work paused — waiting for approval to continue.",
    fr: "Travail en pause — en attente d'approbation.",
    ro: "Lucru oprit — aștept aprobare pentru a continua.",
    pt: "Trabalho pausado — aguardando aprovação.",
    ru: "Работа приостановлена — жду одобрения.",
  },
  'status-test-drive': {
    en: "Taking the vehicle for a test drive now.",
    fr: "Je fais un essai routier maintenant.",
    ro: "Fac un test drive acum.",
    pt: "A fazer test drive agora.",
    ru: "Провожу тестовую поездку.",
  },
  'status-quality-check': {
    en: "Running final quality check before handover.",
    fr: "Contrôle qualité final avant remise.",
    ro: "Fac verificarea finală înainte de predare.",
    pt: "Verificação final antes da entrega.",
    ru: "Финальная проверка перед выдачей.",
  },
  'status-on-lift': {
    en: "Vehicle is on the lift, inspection in progress.",
    fr: "Véhicule sur le pont, inspection en cours.",
    ro: "Vehiculul e pe lift, inspectez.",
    pt: "Veículo no elevador, inspeção em curso.",
    ru: "Авто на подъёмнике, идёт осмотр.",
  },
  'status-waiting-bay': {
    en: "Waiting for a free bay to start work.",
    fr: "En attente d'une place libre pour commencer.",
    ro: "Aștept un loc liber pentru a începe.",
    pt: "Aguardando box livre para começar.",
    ru: "Жду свободный пост для начала работы.",
  },

  // ── STATUS (Manager/Office) ──────────────────────────────────
  'status-job-received': {
    en: "Job received — we'll assign a mechanic shortly.",
    fr: "Job reçu — un mécanicien sera assigné sous peu.",
    ro: "Job primit — vom aloca un mecanic în curând.",
    pt: "Serviço recebido — atribuiremos um mecânico em breve.",
    ru: "Заказ получен — скоро назначим механика.",
  },
  'status-mechanic-assigned': {
    en: "A mechanic has been assigned to your vehicle.",
    fr: "Un mécanicien a été assigné à votre véhicule.",
    ro: "Un mecanic a fost alocat vehiculului dvs.",
    pt: "Um mecânico foi atribuído ao seu veículo.",
    ru: "Механик назначен на ваш автомобиль.",
  },
  'status-in-queue': {
    en: "Your vehicle is in the queue. We'll update you when work begins.",
    fr: "Votre véhicule est en file d'attente. On vous informera quand ça commence.",
    ro: "Vehiculul dvs. este la rând. Vă anunțăm când începem.",
    pt: "O seu veículo está na fila. Informaremos quando começar.",
    ru: "Ваш автомобиль в очереди. Сообщим, когда начнём.",
  },

  // ── PARTS ──────────────────────────────────────────────────────
  'parts-delayed': {
    en: "Parts delivery is delayed. Will update you when they arrive.",
    fr: "La livraison des pièces est retardée. Je vous tiendrai informé.",
    ro: "Livrarea pieselor e întârziată. Vă voi anunța când sosesc.",
    pt: "Entrega de peças atrasada. Informo quando chegarem.",
    ru: "Доставка запчастей задерживается. Сообщу, когда прибудут.",
  },
  'parts-arrived': {
    en: "Parts have arrived! Continuing work now.",
    fr: "Les pièces sont arrivées ! Je reprends le travail.",
    ro: "Piesele au sosit! Continui lucrul.",
    pt: "Peças chegaram! Continuando o trabalho.",
    ru: "Запчасти прибыли! Продолжаю работу.",
  },
  'parts-ordered': {
    en: "Parts have been ordered — expected delivery tomorrow.",
    fr: "Pièces commandées — livraison prévue demain.",
    ro: "Piesele au fost comandate — livrare mâine.",
    pt: "Peças encomendadas — entrega prevista amanhã.",
    ru: "Запчасти заказаны — доставка завтра.",
  },
  'parts-not-available': {
    en: "Required part is out of stock. Looking for alternatives.",
    fr: "Pièce requise en rupture de stock. Je cherche des alternatives.",
    ro: "Piesa necesară nu e în stoc. Caut alternative.",
    pt: "Peça necessária sem stock. Procurando alternativas.",
    ru: "Нужная деталь отсутствует на складе. Ищу альтернативы.",
  },
  'parts-need-approval': {
    en: "Need approval to order this part. Cost estimate attached.",
    fr: "Besoin d'approbation pour commander cette pièce. Devis joint.",
    ro: "Am nevoie de aprobare pentru a comanda piesa. Estimare atașată.",
    pt: "Preciso de aprovação para encomendar esta peça. Orçamento anexo.",
    ru: "Нужно одобрение на заказ детали. Смета прилагается.",
  },
  'parts-installed': {
    en: "New part installed successfully. Testing now.",
    fr: "Nouvelle pièce installée. Test en cours.",
    ro: "Piesă nouă instalată cu succes. Testez acum.",
    pt: "Peça nova instalada com sucesso. Testando agora.",
    ru: "Новая деталь установлена. Тестирую.",
  },
  'parts-warranty': {
    en: "This part may be covered under warranty. Checking now.",
    fr: "Cette pièce pourrait être sous garantie. Vérification en cours.",
    ro: "Această piesă ar putea fi acoperită de garanție. Verific.",
    pt: "Esta peça pode estar na garantia. Verificando.",
    ru: "Эта деталь может быть на гарантии. Проверяю.",
  },

  // ── ISSUE / DIAGNOSIS ─────────────────────────────────────────
  'issue-need-info': {
    en: "I need more information about the problem. Can you provide details?",
    fr: "J'ai besoin de plus d'informations. Pouvez-vous donner des détails ?",
    ro: "Am nevoie de mai multe informații. Puteți da detalii?",
    pt: "Preciso de mais informações. Pode dar detalhes?",
    ru: "Мне нужна дополнительная информация. Можете уточнить?",
  },
  'issue-found-additional': {
    en: "Found an additional issue. Awaiting instructions to proceed.",
    fr: "Problème supplémentaire trouvé. En attente d'instructions.",
    ro: "Am găsit o problemă suplimentară. Aștept instrucțiuni.",
    pt: "Encontrei um problema adicional. Aguardando instruções.",
    ru: "Обнаружил дополнительную проблему. Жду указаний.",
  },
  'issue-more-complex': {
    en: "The issue is more complex than expected. Will take more time.",
    fr: "Le problème est plus complexe que prévu. Cela prendra plus de temps.",
    ro: "Problema e mai complexă decât așteptat. Va dura mai mult.",
    pt: "O problema é mais complexo que o esperado. Vai demorar mais.",
    ru: "Проблема сложнее, чем ожидалось. Потребуется больше времени.",
  },

  // ── DIAGNOSTIC ─────────────────────────────────────────────────
  'diag-visual-done': {
    en: "Visual inspection completed. Sending findings shortly.",
    fr: "Inspection visuelle terminée. Résultats sous peu.",
    ro: "Inspecție vizuală finalizată. Trimit constatările în curând.",
    pt: "Inspeção visual concluída. Envio resultados em breve.",
    ru: "Визуальный осмотр завершён. Скоро отправлю результаты.",
  },
  'diag-scan-done': {
    en: "Diagnostic scan complete. Found error codes — details to follow.",
    fr: "Scan diagnostic terminé. Codes d'erreur trouvés — détails à suivre.",
    ro: "Scanare diagnostică completă. Am găsit coduri eroare — detalii urmează.",
    pt: "Scan diagnóstico concluído. Códigos de erro encontrados — detalhes a seguir.",
    ru: "Диагностика завершена. Найдены коды ошибок — подробности следуют.",
  },
  'diag-no-fault': {
    en: "No faults detected during diagnostic. Vehicle is in good condition.",
    fr: "Aucun défaut détecté. Le véhicule est en bon état.",
    ro: "Niciun defect detectat. Vehiculul e în stare bună.",
    pt: "Nenhuma falha detetada. Veículo em bom estado.",
    ru: "Неисправностей не обнаружено. Авто в хорошем состоянии.",
  },
  'diag-safety-concern': {
    en: "⚠️ Safety concern found — this needs immediate attention.",
    fr: "⚠️ Problème de sécurité trouvé — attention immédiate requise.",
    ro: "⚠️ Problemă de siguranță — necesită atenție imediată.",
    pt: "⚠️ Problema de segurança — atenção imediata necessária.",
    ru: "⚠️ Обнаружена проблема безопасности — требуется срочное внимание.",
  },
  'diag-wear-normal': {
    en: "Normal wear detected. No immediate action required.",
    fr: "Usure normale détectée. Aucune action immédiate requise.",
    ro: "Uzură normală detectată. Nu necesită acțiune imediată.",
    pt: "Desgaste normal detetado. Sem ação imediata necessária.",
    ru: "Обнаружен нормальный износ. Немедленных действий не требуется.",
  },
  'diag-recommend-service': {
    en: "Recommend a follow-up service within the next 2 weeks.",
    fr: "Je recommande un suivi dans les 2 prochaines semaines.",
    ro: "Recomand un service de urmărire în următoarele 2 săptămâni.",
    pt: "Recomendo revisão nas próximas 2 semanas.",
    ru: "Рекомендую повторное обслуживание в ближайшие 2 недели.",
  },
  'diag-photo-sent': {
    en: "Sending photos of the issue for your review.",
    fr: "J'envoie des photos du problème pour examen.",
    ro: "Trimit poze cu problema pentru examinare.",
    pt: "Enviando fotos do problema para análise.",
    ru: "Отправляю фото проблемы для ознакомления.",
  },

  // ── GREETING / QUICK RESPONSES ─────────────────────────────────
  'greeting-understood': {
    en: "Understood, I'll take care of it.",
    fr: "Compris, je m'en occupe.",
    ro: "Am înțeles, mă ocup.",
    pt: "Entendido, vou tratar disso.",
    ru: "Понятно, займусь этим.",
  },
  'greeting-thanks': {
    en: "Thank you for the information!",
    fr: "Merci pour l'information !",
    ro: "Mulțumesc pentru informație!",
    pt: "Obrigado pela informação!",
    ru: "Спасибо за информацию!",
  },
  'greeting-will-update': {
    en: "I'll keep you updated on the progress.",
    fr: "Je vous tiendrai informé de l'avancement.",
    ro: "Vă voi ține la curent cu progresul.",
    pt: "Vou mantê-lo informado sobre o progresso.",
    ru: "Буду информировать о ходе работы.",
  },
  'greeting-ok': {
    en: "OK, noted.",
    fr: "OK, noté.",
    ro: "OK, am notat.",
    pt: "OK, anotado.",
    ru: "Хорошо, принято.",
  },
  'greeting-on-it': {
    en: "On it!",
    fr: "Je m'en occupe !",
    ro: "Mă ocup!",
    pt: "Já estou tratando!",
    ru: "Уже делаю!",
  },
  'greeting-checking': {
    en: "Let me check and get back to you.",
    fr: "Je vérifie et je reviens vers vous.",
    ro: "Verific și revin.",
    pt: "Vou verificar e volto já.",
    ru: "Проверю и вернусь с ответом.",
  },

  // ── SCHEDULING (Manager/Office) ────────────────────────────────
  'sched-appointment-confirm': {
    en: "Your appointment is confirmed. See you then!",
    fr: "Votre rendez-vous est confirmé. À bientôt !",
    ro: "Programarea dvs. este confirmată. Ne vedem!",
    pt: "A sua marcação está confirmada. Até lá!",
    ru: "Ваша запись подтверждена. До встречи!",
  },
  'sched-reschedule': {
    en: "We need to reschedule your appointment. When works best for you?",
    fr: "Nous devons reprogrammer votre rendez-vous. Quand vous convient ?",
    ro: "Trebuie să reprogramăm. Când vă convine?",
    pt: "Precisamos reagendar. Quando é melhor para si?",
    ru: "Нужно перенести запись. Когда вам удобно?",
  },
  'sched-reminder': {
    en: "Reminder: your vehicle is scheduled for service tomorrow.",
    fr: "Rappel : votre véhicule est prévu pour demain.",
    ro: "Reminder: vehiculul dvs. este programat mâine.",
    pt: "Lembrete: o seu veículo está agendado para amanhã.",
    ru: "Напоминание: ваш автомобиль записан на завтра.",
  },
  'sched-drop-off-time': {
    en: "Please drop off your vehicle between 8:00 and 9:00 AM.",
    fr: "Veuillez déposer votre véhicule entre 8h et 9h.",
    ro: "Vă rugăm să aduceți vehiculul între 8:00 și 9:00.",
    pt: "Por favor traga o veículo entre as 8h e as 9h.",
    ru: "Пожалуйста, пригоните авто с 8:00 до 9:00.",
  },
  'sched-pickup-ready': {
    en: "Your vehicle is ready for pickup. We're open until 6 PM.",
    fr: "Votre véhicule est prêt. Nous sommes ouverts jusqu'à 18h.",
    ro: "Vehiculul dvs. e gata. Suntem deschiși până la 18:00.",
    pt: "O seu veículo está pronto. Estamos abertos até às 18h.",
    ru: "Ваш автомобиль готов. Мы работаем до 18:00.",
  },
  'sched-estimated-time': {
    en: "Estimated completion time: end of day today.",
    fr: "Heure estimée : fin de journée aujourd'hui.",
    ro: "Estimare finalizare: sfârșitul zilei de azi.",
    pt: "Tempo estimado: fim do dia de hoje.",
    ru: "Ориентировочное время: до конца дня.",
  },
  'sched-delay-notify': {
    en: "We're running a bit behind schedule. Updated ETA to follow.",
    fr: "Nous avons un léger retard. Nouvelle estimation à suivre.",
    ro: "Avem o ușoară întârziere. Estimarea actualizată urmează.",
    pt: "Estamos com um ligeiro atraso. Nova estimativa a seguir.",
    ru: "Немного отстаём от графика. Обновлённое время — скоро.",
  },

  // ── PAYMENT (Manager/Office) ───────────────────────────────────
  'pay-estimate-sent': {
    en: "Cost estimate has been sent. Please review and approve.",
    fr: "Le devis a été envoyé. Veuillez le consulter et approuver.",
    ro: "Estimarea de cost a fost trimisă. Vă rugăm să o examinați.",
    pt: "O orçamento foi enviado. Por favor revise e aprove.",
    ru: "Смета отправлена. Пожалуйста, ознакомьтесь и подтвердите.",
  },
  'pay-invoice-ready': {
    en: "Your invoice is ready. You can pay at pickup.",
    fr: "Votre facture est prête. Vous pouvez payer à la récupération.",
    ro: "Factura dvs. e gata. Puteți plăti la ridicare.",
    pt: "A sua fatura está pronta. Pode pagar na recolha.",
    ru: "Ваш счёт готов. Оплата при получении.",
  },
  'pay-reminder': {
    en: "Friendly reminder: invoice payment is due soon.",
    fr: "Rappel : le paiement de la facture est bientôt dû.",
    ro: "Reminder: plata facturii este scadentă în curând.",
    pt: "Lembrete: o pagamento da fatura vence em breve.",
    ru: "Напоминание: срок оплаты счёта скоро истекает.",
  },
  'pay-received': {
    en: "Payment received. Thank you!",
    fr: "Paiement reçu. Merci !",
    ro: "Plata primită. Mulțumim!",
    pt: "Pagamento recebido. Obrigado!",
    ru: "Оплата получена. Спасибо!",
  },
  'pay-additional-cost': {
    en: "Additional work required. Updated cost estimate to follow.",
    fr: "Travail supplémentaire requis. Nouveau devis à suivre.",
    ro: "Lucrări suplimentare necesare. Estimare actualizată urmează.",
    pt: "Trabalho adicional necessário. Novo orçamento a seguir.",
    ru: "Требуются доп. работы. Обновлённая смета — скоро.",
  },

  // ── APPROVAL (Manager/Office) ──────────────────────────────────
  'approval-request': {
    en: "Approval needed for additional repairs. Please confirm.",
    fr: "Approbation requise pour des réparations supplémentaires. Merci de confirmer.",
    ro: "Aprobare necesară pentru reparații suplimentare. Confirmați, vă rog.",
    pt: "Aprovação necessária para reparações adicionais. Por favor confirme.",
    ru: "Нужно одобрение на доп. ремонт. Пожалуйста, подтвердите.",
  },
  'approval-approved': {
    en: "Approved! Work will proceed as discussed.",
    fr: "Approuvé ! Le travail va se poursuivre comme convenu.",
    ro: "Aprobat! Lucrările vor continua conform discuției.",
    pt: "Aprovado! O trabalho prosseguirá conforme combinado.",
    ru: "Одобрено! Работа продолжится по плану.",
  },
  'approval-declined': {
    en: "Request declined. Please discuss alternatives with the team.",
    fr: "Demande refusée. Veuillez discuter des alternatives avec l'équipe.",
    ro: "Cerere respinsă. Discutați alternative cu echipa.",
    pt: "Pedido recusado. Discuta alternativas com a equipa.",
    ru: "Запрос отклонён. Обсудите альтернативы с командой.",
  },
  'approval-waiting-customer': {
    en: "Waiting for customer approval before proceeding.",
    fr: "En attente de l'approbation du client avant de continuer.",
    ro: "Așteptăm aprobarea clientului înainte de a continua.",
    pt: "Aguardando aprovação do cliente antes de prosseguir.",
    ru: "Ждём одобрения клиента для продолжения.",
  },

  // ── FOLLOW-UP ──────────────────────────────────────────────────
  'followup-satisfaction': {
    en: "How's the vehicle running after the service? Any concerns?",
    fr: "Comment va le véhicule après le service ? Des soucis ?",
    ro: "Cum merge vehiculul după service? Aveți nelămuriri?",
    pt: "Como está o veículo após o serviço? Alguma preocupação?",
    ru: "Как авто после обслуживания? Есть замечания?",
  },
  'followup-next-service': {
    en: "Reminder: your next service is due in 3 months / 5000 km.",
    fr: "Rappel : prochain service dans 3 mois / 5000 km.",
    ro: "Reminder: următorul service e peste 3 luni / 5000 km.",
    pt: "Lembrete: próxima revisão em 3 meses / 5000 km.",
    ru: "Напоминание: следующее ТО через 3 месяца / 5000 км.",
  },
  'followup-thank-you': {
    en: "Thank you for choosing us! We appreciate your trust.",
    fr: "Merci de nous avoir choisis ! Nous apprécions votre confiance.",
    ro: "Mulțumim că ne-ați ales! Apreciem încrederea dvs.",
    pt: "Obrigado por nos escolher! Agradecemos a sua confiança.",
    ru: "Спасибо, что выбрали нас! Ценим ваше доверие.",
  },
  'followup-issue-resolved': {
    en: "Just checking — is the issue fully resolved?",
    fr: "Juste pour vérifier — le problème est-il résolu ?",
    ro: "Doar verific — problema e complet rezolvată?",
    pt: "Só para confirmar — o problema ficou resolvido?",
    ru: "Уточняю — проблема полностью решена?",
  },
  'followup-recommendation': {
    en: "Based on our inspection, we recommend servicing the brakes soon.",
    fr: "Suite à notre inspection, nous recommandons de réviser les freins bientôt.",
    ro: "Pe baza inspecției, recomandăm revizuirea frânelor în curând.",
    pt: "Com base na inspeção, recomendamos revisar os travões em breve.",
    ru: "По результатам осмотра рекомендуем скоро проверить тормоза.",
  },
  'followup-warranty-info': {
    en: "The repair is covered by our 6-month warranty.",
    fr: "La réparation est couverte par notre garantie de 6 mois.",
    ro: "Reparația este acoperită de garanția noastră de 6 luni.",
    pt: "A reparação está coberta pela nossa garantia de 6 meses.",
    ru: "Ремонт покрывается нашей гарантией на 6 месяцев.",
  },

  // ── MECHANIC EXTRAS ────────────────────────────────────────────
  'mech-need-help': {
    en: "I need assistance from another mechanic on this one.",
    fr: "J'ai besoin de l'aide d'un autre mécanicien.",
    ro: "Am nevoie de ajutor de la alt mecanic.",
    pt: "Preciso de ajuda de outro mecânico.",
    ru: "Мне нужна помощь другого механика.",
  },
  'mech-tool-needed': {
    en: "Need a special tool for this job. Checking availability.",
    fr: "Besoin d'un outil spécial. Je vérifie la disponibilité.",
    ro: "Am nevoie de o unealtă specială. Verific disponibilitatea.",
    pt: "Preciso de ferramenta especial. Verificando disponibilidade.",
    ru: "Нужен спец. инструмент. Проверяю наличие.",
  },
  'mech-handover-notes': {
    en: "Handover note: job in progress, left at stage — see details.",
    fr: "Note de passation : travail en cours, laissé à l'étape — voir détails.",
    ro: "Notă de predare: lucru în curs, lăsat la etapa — vezi detalii.",
    pt: "Nota de passagem: trabalho em curso, na etapa — ver detalhes.",
    ru: "Записка при передаче: работа в процессе — см. детали.",
  },
  'mech-cleaning': {
    en: "Cleaning up the work area and vehicle before handover.",
    fr: "Nettoyage de la zone de travail et du véhicule avant remise.",
    ro: "Curăț zona de lucru și vehiculul înainte de predare.",
    pt: "Limpando a área de trabalho e o veículo antes da entrega.",
    ru: "Убираю рабочую зону и авто перед выдачей.",
  },
  'mech-fluid-levels': {
    en: "All fluid levels checked and topped up.",
    fr: "Tous les niveaux de liquides vérifiés et complétés.",
    ro: "Toate nivelurile de lichide verificate și completate.",
    pt: "Todos os níveis de fluidos verificados e completados.",
    ru: "Все уровни жидкостей проверены и долиты.",
  },
  'mech-tire-pressure': {
    en: "Tire pressures checked and adjusted to spec.",
    fr: "Pressions des pneus vérifiées et ajustées.",
    ro: "Presiunile anvelopelor verificate și ajustate.",
    pt: "Pressões dos pneus verificadas e ajustadas.",
    ru: "Давление в шинах проверено и отрегулировано.",
  },

  // ── OFFICE EXTRAS ──────────────────────────────────────────────
  'office-docs-ready': {
    en: "All documents are ready for pickup.",
    fr: "Tous les documents sont prêts à être récupérés.",
    ro: "Toate documentele sunt gata de ridicare.",
    pt: "Todos os documentos estão prontos para recolha.",
    ru: "Все документы готовы к получению.",
  },
  'office-insurance-check': {
    en: "Checking insurance coverage for this repair.",
    fr: "Vérification de la couverture d'assurance pour cette réparation.",
    ro: "Verific acoperirea asigurării pentru această reparație.",
    pt: "Verificando cobertura do seguro para esta reparação.",
    ru: "Проверяю страховое покрытие для этого ремонта.",
  },
  'office-courtesy-car': {
    en: "A courtesy vehicle is available if needed.",
    fr: "Un véhicule de courtoisie est disponible si nécessaire.",
    ro: "Un vehicul de curtoazie este disponibil dacă este necesar.",
    pt: "Um veículo de cortesia está disponível se necessário.",
    ru: "Подменный автомобиль доступен при необходимости.",
  },
  'office-update-request': {
    en: "Can you provide an update on this job?",
    fr: "Pouvez-vous donner une mise à jour sur ce travail ?",
    ro: "Puteți da un update la acest job?",
    pt: "Pode dar uma atualização sobre este serviço?",
    ru: "Можете дать обновление по этому заказу?",
  },
};

/**
 * Predefined message templates for quick replies
 */
export const messageTemplates: MessageTemplate[] = [
  // ── STATUS (Mechanic) ──
  { id: 'status-on-the-way', text: "I'm on my way to start working on this job.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-started', text: "I've started working on this job.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-almost-done', text: "Almost finished! Just a few more minutes.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-ready-pickup', text: "Job completed! Vehicle is ready for pickup.", category: 'status', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'status-paused', text: "Work paused — waiting for approval to continue.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-test-drive', text: "Taking the vehicle for a test drive now.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-quality-check', text: "Running final quality check before handover.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-on-lift', text: "Vehicle is on the lift, inspection in progress.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'status-waiting-bay', text: "Waiting for a free bay to start work.", category: 'status', availableRoles: ['mechanic'] },

  // ── STATUS (Manager/Office) ──
  { id: 'status-job-received', text: "Job received — we'll assign a mechanic shortly.", category: 'status', availableRoles: ['office_staff', 'manager'] },
  { id: 'status-mechanic-assigned', text: "A mechanic has been assigned to your vehicle.", category: 'status', availableRoles: ['office_staff', 'manager'] },
  { id: 'status-in-queue', text: "Your vehicle is in the queue. We'll update you when work begins.", category: 'status', availableRoles: ['office_staff', 'manager'] },

  // ── PARTS ──
  { id: 'parts-delayed', text: "Parts delivery is delayed. Will update you when they arrive.", category: 'parts', availableRoles: ['mechanic', 'office_staff', 'manager'] },
  { id: 'parts-arrived', text: "Parts have arrived! Continuing work now.", category: 'parts', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'parts-ordered', text: "Parts have been ordered — expected delivery tomorrow.", category: 'parts', availableRoles: ['office_staff', 'manager'] },
  { id: 'parts-not-available', text: "Required part is out of stock. Looking for alternatives.", category: 'parts', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'parts-need-approval', text: "Need approval to order this part. Cost estimate attached.", category: 'parts', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'parts-installed', text: "New part installed successfully. Testing now.", category: 'parts', availableRoles: ['mechanic'] },
  { id: 'parts-warranty', text: "This part may be covered under warranty. Checking now.", category: 'parts', availableRoles: ['office_staff', 'manager'] },

  // ── ISSUE ──
  { id: 'issue-need-info', text: "I need more information about the problem. Can you provide details?", category: 'issue', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'issue-found-additional', text: "Found an additional issue. Awaiting instructions to proceed.", category: 'issue', availableRoles: ['mechanic'] },
  { id: 'issue-more-complex', text: "The issue is more complex than expected. Will take more time.", category: 'issue', availableRoles: ['mechanic'] },

  // ── DIAGNOSTIC ──
  { id: 'diag-visual-done', text: "Visual inspection completed. Sending findings shortly.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'diag-scan-done', text: "Diagnostic scan complete. Found error codes — details to follow.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'diag-no-fault', text: "No faults detected during diagnostic. Vehicle is in good condition.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'diag-safety-concern', text: "⚠️ Safety concern found — this needs immediate attention.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'diag-wear-normal', text: "Normal wear detected. No immediate action required.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'diag-recommend-service', text: "Recommend a follow-up service within the next 2 weeks.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'diag-photo-sent', text: "Sending photos of the issue for your review.", category: 'diagnostic', availableRoles: ['mechanic'] },

  // ── GREETING / QUICK RESPONSES ──
  { id: 'greeting-understood', text: "Understood, I'll take care of it.", category: 'greeting', availableRoles: ['mechanic', 'office_staff', 'manager'] },
  { id: 'greeting-thanks', text: "Thank you for the information!", category: 'greeting', availableRoles: ['mechanic', 'office_staff', 'manager', 'admin'] },
  { id: 'greeting-will-update', text: "I'll keep you updated on the progress.", category: 'greeting', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'greeting-ok', text: "OK, noted.", category: 'greeting', availableRoles: ['mechanic', 'office_staff', 'manager', 'admin'] },
  { id: 'greeting-on-it', text: "On it!", category: 'greeting', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'greeting-checking', text: "Let me check and get back to you.", category: 'greeting', availableRoles: ['mechanic', 'office_staff', 'manager'] },

  // ── SCHEDULING ──
  { id: 'sched-appointment-confirm', text: "Your appointment is confirmed. See you then!", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },
  { id: 'sched-reschedule', text: "We need to reschedule your appointment. When works best for you?", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },
  { id: 'sched-reminder', text: "Reminder: your vehicle is scheduled for service tomorrow.", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },
  { id: 'sched-drop-off-time', text: "Please drop off your vehicle between 8:00 and 9:00 AM.", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },
  { id: 'sched-pickup-ready', text: "Your vehicle is ready for pickup. We're open until 6 PM.", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },
  { id: 'sched-estimated-time', text: "Estimated completion time: end of day today.", category: 'scheduling', availableRoles: ['office_staff', 'manager', 'mechanic'] },
  { id: 'sched-delay-notify', text: "We're running a bit behind schedule. Updated ETA to follow.", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },

  // ── PAYMENT ──
  { id: 'pay-estimate-sent', text: "Cost estimate has been sent. Please review and approve.", category: 'payment', availableRoles: ['office_staff', 'manager'] },
  { id: 'pay-invoice-ready', text: "Your invoice is ready. You can pay at pickup.", category: 'payment', availableRoles: ['office_staff', 'manager'] },
  { id: 'pay-reminder', text: "Friendly reminder: invoice payment is due soon.", category: 'payment', availableRoles: ['office_staff', 'manager'] },
  { id: 'pay-received', text: "Payment received. Thank you!", category: 'payment', availableRoles: ['office_staff', 'manager'] },
  { id: 'pay-additional-cost', text: "Additional work required. Updated cost estimate to follow.", category: 'payment', availableRoles: ['office_staff', 'manager'] },

  // ── APPROVAL ──
  { id: 'approval-request', text: "Approval needed for additional repairs. Please confirm.", category: 'approval', availableRoles: ['mechanic', 'office_staff', 'manager'] },
  { id: 'approval-approved', text: "Approved! Work will proceed as discussed.", category: 'approval', availableRoles: ['office_staff', 'manager'] },
  { id: 'approval-declined', text: "Request declined. Please discuss alternatives with the team.", category: 'approval', availableRoles: ['office_staff', 'manager'] },
  { id: 'approval-waiting-customer', text: "Waiting for customer approval before proceeding.", category: 'approval', availableRoles: ['office_staff', 'manager'] },

  // ── FOLLOW-UP ──
  { id: 'followup-satisfaction', text: "How's the vehicle running after the service? Any concerns?", category: 'follow_up', availableRoles: ['office_staff', 'manager'] },
  { id: 'followup-next-service', text: "Reminder: your next service is due in 3 months / 5000 km.", category: 'follow_up', availableRoles: ['office_staff', 'manager'] },
  { id: 'followup-thank-you', text: "Thank you for choosing us! We appreciate your trust.", category: 'follow_up', availableRoles: ['office_staff', 'manager'] },
  { id: 'followup-issue-resolved', text: "Just checking — is the issue fully resolved?", category: 'follow_up', availableRoles: ['office_staff', 'manager', 'mechanic'] },
  { id: 'followup-recommendation', text: "Based on our inspection, we recommend servicing the brakes soon.", category: 'follow_up', availableRoles: ['mechanic', 'office_staff'] },
  { id: 'followup-warranty-info', text: "The repair is covered by our 6-month warranty.", category: 'follow_up', availableRoles: ['office_staff', 'manager'] },

  // ── MECHANIC EXTRAS ──
  { id: 'mech-need-help', text: "I need assistance from another mechanic on this one.", category: 'issue', availableRoles: ['mechanic'] },
  { id: 'mech-tool-needed', text: "Need a special tool for this job. Checking availability.", category: 'issue', availableRoles: ['mechanic'] },
  { id: 'mech-handover-notes', text: "Handover note: job in progress, left at stage — see details.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'mech-cleaning', text: "Cleaning up the work area and vehicle before handover.", category: 'status', availableRoles: ['mechanic'] },
  { id: 'mech-fluid-levels', text: "All fluid levels checked and topped up.", category: 'diagnostic', availableRoles: ['mechanic'] },
  { id: 'mech-tire-pressure', text: "Tire pressures checked and adjusted to spec.", category: 'diagnostic', availableRoles: ['mechanic'] },

  // ── OFFICE EXTRAS ──
  { id: 'office-docs-ready', text: "All documents are ready for pickup.", category: 'status', availableRoles: ['office_staff', 'manager'] },
  { id: 'office-insurance-check', text: "Checking insurance coverage for this repair.", category: 'payment', availableRoles: ['office_staff', 'manager'] },
  { id: 'office-courtesy-car', text: "A courtesy vehicle is available if needed.", category: 'scheduling', availableRoles: ['office_staff', 'manager'] },
  { id: 'office-update-request', text: "Can you provide an update on this job?", category: 'status', availableRoles: ['office_staff', 'manager'] },
];

/**
 * Get the translated text for a template
 */
export function getTemplateText(template: MessageTemplate, language: Language): string {
  const translations = templateTranslations[template.id];
  if (translations && translations[language]) {
    return translations[language];
  }
  return template.text;
}

/**
 * Get templates available for a specific user role
 */
export function getTemplatesForRole(role: UserRole): MessageTemplate[] {
  return messageTemplates.filter(template =>
    template.availableRoles.includes(role)
  );
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
  return messageTemplates.filter(template => template.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): MessageTemplate | undefined {
  return messageTemplates.find(template => template.id === id);
}

/**
 * Category labels per language
 */
const categoryLabelTranslations: Record<string, Record<Language, string>> = {
  status: { en: 'Status', fr: 'Statut', ro: 'Status', pt: 'Estado', ru: 'Статус' },
  greeting: { en: 'Quick', fr: 'Rapide', ro: 'Rapid', pt: 'Rápido', ru: 'Быстрые' },
  issue: { en: 'Issues', fr: 'Problèmes', ro: 'Probleme', pt: 'Problemas', ru: 'Проблемы' },
  parts: { en: 'Parts', fr: 'Pièces', ro: 'Piese', pt: 'Peças', ru: 'Запчасти' },
  diagnostic: { en: 'Diagnostic', fr: 'Diagnostic', ro: 'Diagnostic', pt: 'Diagnóstico', ru: 'Диагностика' },
  scheduling: { en: 'Schedule', fr: 'Planning', ro: 'Programare', pt: 'Agenda', ru: 'Расписание' },
  payment: { en: 'Payment', fr: 'Paiement', ro: 'Plată', pt: 'Pagamento', ru: 'Оплата' },
  approval: { en: 'Approval', fr: 'Approbation', ro: 'Aprobare', pt: 'Aprovação', ru: 'Одобрение' },
  follow_up: { en: 'Follow-up', fr: 'Suivi', ro: 'Urmărire', pt: 'Seguimento', ru: 'Контроль' },
};

/**
 * Category labels for UI display (English default)
 */
export const categoryLabels: Record<string, string> = {
  status: 'Status',
  greeting: 'Quick',
  issue: 'Issues',
  parts: 'Parts',
  diagnostic: 'Diagnostic',
  scheduling: 'Schedule',
  payment: 'Payment',
  approval: 'Approval',
  follow_up: 'Follow-up',
};

/**
 * Category emoji prefixes for compact display
 */
export const categoryEmojis: Record<string, string> = {
  status: '📋',
  greeting: '💬',
  issue: '⚠️',
  parts: '🔧',
  diagnostic: '🔍',
  scheduling: '📅',
  payment: '💳',
  approval: '✅',
  follow_up: '🔄',
};

/**
 * Get translated category label
 */
export function getCategoryLabel(category: string, language: Language): string {
  const translations = categoryLabelTranslations[category];
  if (translations && translations[language]) {
    return translations[language];
  }
  return categoryLabels[category] || category;
}
