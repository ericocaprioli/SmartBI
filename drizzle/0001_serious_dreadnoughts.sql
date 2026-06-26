CREATE TABLE `funcionarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`funcao` varchar(255) NOT NULL,
	`situacao` enum('CLT','Contrato','Experiência') NOT NULL,
	`forma_pagamento` varchar(100) NOT NULL,
	`pix` varchar(255),
	`salario_base` int NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funcionarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funcionario_id` int NOT NULL,
	`mes_referencia` varchar(7) NOT NULL,
	`dias_trabalhados` int,
	`salario_base_mes` int,
	`valor_dia` int,
	`salario_bruto` int,
	`salario_familia` int DEFAULT 0,
	`premio_producao` int DEFAULT 0,
	`premio_assiduidade` int DEFAULT 0,
	`hora_extra` int DEFAULT 0,
	`inss` int DEFAULT 0,
	`desconto_diversos` int DEFAULT 0,
	`salario_liquido` int,
	`ferias` int DEFAULT 0,
	`terco_ferias` int DEFAULT 0,
	`decimo_terceiro` int DEFAULT 0,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pagamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `producao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funcionario_id` int NOT NULL,
	`mes_referencia` varchar(7) NOT NULL,
	`meta_dia` int,
	`meta_mes` int,
	`valor_peca` int,
	`producao_realizada` int DEFAULT 0,
	`faturamento_mensal` int DEFAULT 0,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `producao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_funcionario_id_funcionarios_id_fk` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `producao` ADD CONSTRAINT `producao_funcionario_id_funcionarios_id_fk` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE no action ON UPDATE no action;