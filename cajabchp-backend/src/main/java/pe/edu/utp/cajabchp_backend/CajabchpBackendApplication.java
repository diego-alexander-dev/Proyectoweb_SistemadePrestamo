package pe.edu.utp.cajabchp_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CajabchpBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CajabchpBackendApplication.class, args);
	}

}
