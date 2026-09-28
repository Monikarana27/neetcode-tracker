import java.util.*;

public class Template_bits {
static int unique(int[] a) {
    int result=0;for(int x:a)result^=x;return result;
} // Exactly one unpaired value; every other value appears twice.

}
